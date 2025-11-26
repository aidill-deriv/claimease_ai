#!/usr/bin/env python3
"""
FastAPI server for ClaimBot with Slack integration.
Handles Slack events and provides REST API endpoints.
"""
import os
import hmac
import hashlib
import time
from typing import Dict, Any
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

# Load environment variables from config/.env
load_dotenv("config/.env")

# Import AI agent
try:
    from ai_agent import ClaimAIAgent
    from auth_stub import mask_email, validate_email
    from logger import setup_logger
    from supabase_service import SupabaseService, SupabaseServiceError
except ImportError:
    from src.ai_agent import ClaimAIAgent
    from src.auth_stub import mask_email, validate_email
    from src.logger import setup_logger
    from src.supabase_service import SupabaseService, SupabaseServiceError

# Initialize FastAPI app
app = FastAPI(
    title="ClaimBot API",
    description="AI-powered claim chatbot for Deriv employees",
    version="1.0.0"
)

# Add CORS middleware to allow requests from React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (including ngrok)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Initialize logger
logger = setup_logger('api')

# Initialize AI agent (singleton)
agent = None
supabase_client = None

def get_agent():
    """Get or create AI agent instance."""
    global agent
    if agent is None:
        agent = ClaimAIAgent()
        logger.info("AI Agent initialized")
    return agent

def get_supabase_client():
    """Get or create Supabase service instance."""
    global supabase_client
    if supabase_client is None:
        supabase_client = SupabaseService()
        logger.info("Supabase service initialized")
    return supabase_client


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting ClaimBot API server...")
    
    # Verify environment variables
    required_vars = ["OPENAI_API_KEY", "SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.warning(f"Missing environment variables: {', '.join(missing_vars)}")
        logger.warning("Slack integration will not work without SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET")
    
    # Initialize agent
    try:
        get_agent()
        logger.info("ClaimBot API server started successfully")
    except Exception as e:
        logger.error(f"Failed to initialize agent: {e}")
        raise


@app.get("/")
async def root():
    """Root endpoint - health check."""
    return {
        "status": "ok",
        "service": "ClaimBot API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "query": "/query",
            "slack_events": "/slack/events"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        agent = get_agent()
        stats = agent.get_memory_stats()
        
        return {
            "status": "healthy",
            "agent": "ready",
            "memory": {
                "active_threads": stats["total_threads"],
                "total_messages": stats["total_messages"],
                "unique_users": stats["unique_users"]
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )


@app.options("/query")
async def query_options():
    """Handle CORS preflight for /query endpoint."""
    return JSONResponse(content={}, status_code=200)


@app.post("/query")
async def query_endpoint(request: Request):
    """
    Direct query endpoint for testing.
    
    Body sample:
    {
        "user_email": "user@example.com",
        "query_text": "What's my balance?",
        "thread_id": "optional-thread-id",
        "context_messages": [{"role": "user", "content": "..."}]
    }
    """
    try:
        data = await request.json()
        user_email = data.get("user_email")
        query_text = data.get("query_text")  # Changed from "query" to "query_text"
        thread_id = data.get("thread_id")
        context_messages = data.get("context_messages")
        
        if not user_email or not query_text:
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: user_email and query_text"
            )
        
        # Query agent
        agent = get_agent()
        result = agent.query(user_email, query_text, thread_id, context_messages)
        
        # Return response in format expected by React frontend
        return {
            "status": "success",
            "response": result["answer"],  # Changed from "answer" to "response"
            "thread_id": thread_id or result.get("thread_id", ""),
            "timestamp": str(time.time()),
            "user_email_hash": result["user_email_hash"],
            "model": result["model"]
        }
        
    except Exception as e:
        logger.error(f"Query endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/feedback")
async def feedback_endpoint(request: Request):
    """Collect thumbs up/down feedback for AI responses."""
    try:
        data = await request.json()
        user_email = (data.get("user_email") or "").strip().lower()
        if not validate_email(user_email):
            raise HTTPException(status_code=400, detail="Invalid user_email")

        message_id = (data.get("message_id") or "").strip()
        rating = (data.get("rating") or "").strip().lower()
        response_text = (data.get("response_text") or "").strip()

        if not message_id:
            raise HTTPException(status_code=400, detail="Missing message_id")
        if rating not in {"up", "down"}:
            raise HTTPException(status_code=400, detail="rating must be 'up' or 'down'")
        if not response_text:
            raise HTTPException(status_code=400, detail="Missing response_text")

        thread_id = (data.get("thread_id") or "").strip() or None
        comment = data.get("comment")
        if isinstance(comment, str):
            comment = comment.strip() or None
        else:
            comment = None

        model = (data.get("model") or "").strip() or None
        metadata = data.get("metadata")
        if not isinstance(metadata, dict):
            metadata = {}

        try:
            supabase = get_supabase_client()
        except SupabaseServiceError as exc:
            logger.error(f"Supabase configuration error: {exc}")
            raise HTTPException(status_code=500, detail="Supabase service unavailable")

        payload: Dict[str, Any] = {
            "thread_id": thread_id,
            "message_id": message_id,
            "user_email_hash": mask_email(user_email),
            "rating": rating,
            "comment": comment,
            "response_text": response_text,
            "model": model,
            "metadata": metadata,
        }

        inserted = supabase.insert_feedback(payload)

        return {
            "status": "success",
            "feedback_id": inserted.get("id"),
            "data": inserted,
        }

    except HTTPException:
        raise
    except SupabaseServiceError as exc:
        logger.error(f"Supabase feedback error: {exc}")
        raise HTTPException(status_code=502, detail="Failed to persist feedback")
    except Exception as e:
        logger.error(f"Feedback endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Event deduplication cache (in-memory)
processed_events = set()

@app.post("/slack/events")
async def slack_events_handler(request: Request):
    """
    Slack event webhook handler with thread-aware memory support.
    
    Handles:
    - URL verification challenge
    - app_mention events
    - Thread-specific conversation context
    """
    try:
        # Get request body
        body = await request.body()
        
        # Step 1: Verify Slack signature
        signature = request.headers.get("X-Slack-Signature", "")
        timestamp = request.headers.get("X-Slack-Request-Timestamp", "")
        
        if not _verify_slack_signature(signature, timestamp, body):
            logger.warning("Invalid Slack signature")
            raise HTTPException(status_code=403, detail="Invalid signature")
        
        # Step 2: Parse event data
        event_data = await request.json()
        
        # Handle URL verification challenge
        if event_data.get("type") == "url_verification":
            challenge = event_data.get("challenge")
            logger.info("Slack URL verification challenge received")
            return {"challenge": challenge}
        
        # Step 3: Check for duplicate events
        event = event_data.get("event", {})
        event_id = event.get("client_msg_id") or event.get("ts")
        
        if event_id and event_id in processed_events:
            logger.debug(f"Duplicate event detected: {event_id}")
            return {"ok": True}
        
        # Add to processed events
        if event_id:
            processed_events.add(event_id)
            # Keep cache size manageable (last 1000 events)
            if len(processed_events) > 1000:
                processed_events.pop()
        
        # Step 4: Extract event details
        event_type = event.get("type")
        
        # Handle app_mention and message.im events
        if event_type not in ["app_mention", "message"]:
            logger.debug(f"Ignoring event type: {event_type}")
            return {"ok": True}
        
        # For message events, only process DMs (channel type = 'im')
        if event_type == "message":
            channel_type = event.get("channel_type")
            if channel_type != "im":
                logger.debug(f"Ignoring message event in non-DM channel: {channel_type}")
                return {"ok": True}
            
            # Ignore bot messages to prevent loops
            # Check both bot_id and if user is the bot itself
            if event.get("bot_id"):
                logger.debug("Ignoring bot message (bot_id present)")
                return {"ok": True}
            
            # Get bot's user ID from authorizations
            bot_user_id = None
            if "authorizations" in event_data and len(event_data["authorizations"]) > 0:
                bot_user_id = event_data["authorizations"][0].get("user_id")
            
            # Check if message is from the bot itself
            message_user_id = event.get("user")
            if bot_user_id and message_user_id == bot_user_id:
                logger.debug(f"Ignoring bot's own message (user_id: {bot_user_id})")
                return {"ok": True}
            
            # Ignore messages with subtype (like bot_message, message_changed, etc.)
            if event.get("subtype"):
                logger.debug(f"Ignoring message with subtype: {event.get('subtype')}")
                return {"ok": True}
        
        # Extract event information
        user_id = event.get("user")
        channel_id = event.get("channel")
        thread_ts = event.get("thread_ts", event.get("ts"))  # Use thread_ts if exists
        text = event.get("text", "")
        is_dm = event.get("channel_type") == "im"
        
        logger.info(f"Received {event_type} from user {user_id} in channel {channel_id} (DM: {is_dm})")
        
        # Step 4: Resolve user_id → email
        slack_token = os.getenv("SLACK_BOT_TOKEN")
        if not slack_token:
            raise HTTPException(
                status_code=500,
                detail="SLACK_BOT_TOKEN not configured"
            )
        
        try:
            user_email = _get_slack_user_email(user_id, slack_token)
            logger.info(f"Resolved user {user_id} to email {mask_email(user_email)}")
        except Exception as e:
            logger.error(f"Failed to resolve user email: {e}")
            # Post error message to thread
            _post_slack_message(
                slack_token,
                channel_id,
                "Sorry, I couldn't identify your email. Please contact HR for assistance.",
                thread_ts
            )
            return {"ok": False, "error": "Failed to resolve user email"}
        
        # Step 5: Clean up query text (remove bot mention)
        # Extract bot_id from authorizations
        bot_id = None
        if "authorizations" in event_data and len(event_data["authorizations"]) > 0:
            bot_id = event_data["authorizations"][0].get("user_id")
        
        query_text = text
        if bot_id:
            query_text = text.replace(f"<@{bot_id}>", "").strip()
        
        # For DMs, no need for @mention
        if not query_text and is_dm:
            query_text = text.strip()
        
        logger.info(f"Query from {mask_email(user_email)}: {query_text}")
        
        # Step 6: Query agent with thread context
        agent = get_agent()
        result = agent.query(
            user_email=user_email,
            query_text=query_text,
            thread_id=thread_ts  # ← Thread-aware memory!
        )
        
        answer = result["answer"]
        contains_pii = result.get("contains_pii", False)
        logger.info(f"Generated response for {mask_email(user_email)} (PII: {contains_pii})")
        
        # Step 7: Handle response based on PII content
        if contains_pii and not is_dm:
            # Send detailed response to DM
            try:
                dm_channel = _open_dm_channel(slack_token, user_id)
                _post_slack_message(slack_token, dm_channel, answer, None)
                logger.info(f"Sent PII response to DM for {mask_email(user_email)}")
                
                # Send acknowledgment in thread
                ack_message = f"🔒 Your inquiry about **{query_text[:50]}{'...' if len(query_text) > 50 else ''}** has been sent to your DM for privacy."
                _post_slack_message(slack_token, channel_id, ack_message, thread_ts)
                logger.info(f"Posted privacy acknowledgment in thread")
            except Exception as e:
                logger.error(f"Failed to send DM: {e}")
                # Fallback: post in thread with warning
                warning = "⚠️ I couldn't send you a DM. Please check your DM settings or contact me directly."
                _post_slack_message(slack_token, channel_id, warning, thread_ts)
        else:
            # Non-PII or already in DM: post normally
            _post_slack_message(slack_token, channel_id, answer, thread_ts)
        
        return {"ok": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Slack event handler error: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": str(e)}
        )


def _verify_slack_signature(signature: str, timestamp: str, body: bytes) -> bool:
    """
    Verify Slack request signature to prevent spoofing.
    
    Args:
        signature: X-Slack-Signature header
        timestamp: X-Slack-Request-Timestamp header
        body: Raw request body
        
    Returns:
        True if signature is valid, False otherwise
    """
    slack_signing_secret = os.getenv("SLACK_SIGNING_SECRET", "").encode()
    
    if not slack_signing_secret:
        logger.warning("SLACK_SIGNING_SECRET not configured")
        return False
    
    # Check timestamp to prevent replay attacks
    try:
        request_timestamp = int(timestamp)
        current_timestamp = int(time.time())
        
        # Request must be within 5 minutes
        if abs(current_timestamp - request_timestamp) > 60 * 5:
            logger.warning("Request timestamp too old")
            return False
    except (ValueError, TypeError):
        logger.warning("Invalid timestamp")
        return False
    
    # Compute signature
    basestring = f"v0:{timestamp}:{body.decode('utf-8')}"
    computed_signature = "v0=" + hmac.new(
        slack_signing_secret,
        basestring.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Compare signatures
    return hmac.compare_digest(computed_signature, signature)


def _get_slack_user_email(user_id: str, slack_token: str) -> str:
    """
    Get user email from Slack user ID.
    
    Args:
        user_id: Slack user ID
        slack_token: Slack bot token
        
    Returns:
        User's email address (lowercase)
        
    Raises:
        SlackApiError: If API call fails
        ValueError: If email not found
    """
    client = WebClient(token=slack_token)
    
    try:
        response = client.users_info(user=user_id)
        
        if not response["ok"]:
            raise ValueError(f"Slack API error: {response.get('error')}")
        
        user_profile = response["user"]["profile"]
        email = user_profile.get("email")
        
        if not email:
            raise ValueError("User email not found in profile")
        
        return email.strip().lower()
        
    except SlackApiError as e:
        logger.error(f"Slack API error: {e}")
        raise


def _open_dm_channel(slack_token: str, user_id: str) -> str:
    """
    Open a DM channel with a user.
    
    Args:
        slack_token: Slack bot token
        user_id: User ID
        
    Returns:
        DM channel ID
        
    Raises:
        SlackApiError: If API call fails
    """
    client = WebClient(token=slack_token)
    
    try:
        response = client.conversations_open(users=[user_id])
        
        if not response["ok"]:
            raise ValueError(f"Failed to open DM: {response.get('error')}")
        
        dm_channel_id = response["channel"]["id"]
        logger.info(f"Opened DM channel {dm_channel_id} with user {user_id}")
        return dm_channel_id
        
    except SlackApiError as e:
        logger.error(f"Failed to open DM channel: {e}")
        raise


def _convert_markdown_to_mrkdwn(text: str) -> str:
    """
    Convert standard Markdown to Slack's mrkdwn format.
    
    Args:
        text: Text with Markdown formatting
        
    Returns:
        Text with Slack mrkdwn formatting
    """
    import re
    
    # Convert [text](url) to <url|text> (Slack link format)
    # This must be done FIRST before other conversions
    text = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'<\2|\1>', text)
    
    # Convert **bold** to *bold*
    text = re.sub(r'\*\*(.+?)\*\*', r'*\1*', text)
    
    # Convert __bold__ to *bold*
    text = re.sub(r'__(.+?)__', r'*\1*', text)
    
    # Convert _italic_ to _italic_ (already correct)
    # But need to handle *italic* -> _italic_
    # Be careful not to affect already converted bold
    text = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'_\1_', text)
    
    # Convert `code` to `code` (already correct)
    
    # Convert ```code block``` to ```code block``` (already correct)
    
    return text


def _post_slack_message(
    slack_token: str,
    channel_id: str,
    text: str,
    thread_ts: str = None
) -> Dict[str, Any]:
    """
    Post message to Slack channel/thread with proper mrkdwn formatting.
    
    Args:
        slack_token: Slack bot token
        channel_id: Channel ID
        text: Message text (will be converted from Markdown to mrkdwn)
        thread_ts: Thread timestamp (optional)
        
    Returns:
        Slack API response
        
    Raises:
        SlackApiError: If API call fails
    """
    client = WebClient(token=slack_token)
    
    # Convert Markdown to Slack mrkdwn
    formatted_text = _convert_markdown_to_mrkdwn(text)
    
    try:
        response = client.chat_postMessage(
            channel=channel_id,
            text=formatted_text,
            thread_ts=thread_ts,
            mrkdwn=True  # Enable mrkdwn formatting
        )
        
        logger.info(f"Posted message to channel {channel_id}")
        return response
        
    except SlackApiError as e:
        logger.error(f"Failed to post message: {e}")
        raise


# Run server
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8001))
    
    print("="*70)
    print("🚀 Starting ClaimBot API Server")
    print("="*70)
    print(f"Port: {port}")
    print(f"Endpoints:")
    print(f"  - Health: http://localhost:{port}/health")
    print(f"  - Query: http://localhost:{port}/query")
    print(f"  - Slack: http://localhost:{port}/slack/events")
    print("="*70)
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
