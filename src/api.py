#!/usr/bin/env python3
"""
FastAPI server for ClaimBot API.
Handles REST API endpoints for the AI agent.
"""
import os
import time
from typing import Dict, Any
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

# Add CORS middleware to allow requests from frontend
# Environment-based CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Local development
    "http://localhost:3001",  # Alternative local port
    FRONTEND_URL,  # Environment-specific frontend URL
]

# Add Vercel preview/production domains if in production
if os.getenv("VERCEL_URL"):
    ALLOWED_ORIGINS.append(f"https://{os.getenv('VERCEL_URL')}")

# Also allow any *.vercel.app domains in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview deployments
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
    required_vars = ["OPENAI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.warning(f"Missing environment variables: {', '.join(missing_vars)}")
    
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
            "query": "/query"
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


# Slack integration removed - no longer needed
# All endpoints above still work for web/API access


# Run server
if __name__ == "__main__":
    import uvicorn
    import time
    
    port = int(os.getenv("PORT", 8001))
    
    print("="*70)
    print("🚀 Starting ClaimBot API Server")
    print("="*70)
    print(f"Port: {port}")
    print(f"Endpoints:")
    print(f"  - Health: http://localhost:{port}/health")
    print(f"  - Query: http://localhost:{port}/query")
    print("="*70)
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
