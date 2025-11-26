# Deploy ClaimBot Agent to Slack (Complete Guide)

Once you've tested locally (CLI + FastAPI), here's how to deploy to Slack.

-test:

./start_server.sh

~/ngrok http 8001


## High-Level Flow

```
Slack Channel: @AgentDock What's my balance?
    ↓
Slack → POST http://your-server/slack/events (webhook)
    ↓
FastAPI /slack/events handler
    • Verify request signature
    • Extract user_id, channel_id, thread_ts
    ↓
Resolve user_id → email (via Slack API)
    ↓
agent.query(email, question)
    ↓
Post reply in thread
    ↓
Response appears under the original message
```

---

## Step 1: Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Name: `ClaimBot` (or your choice)
4. Select your workspace
5. Click **"Create App"**

---

## Step 2: Set Up Event Subscriptions

1. In app settings, go to **"Event Subscriptions"** (left sidebar)
2. Toggle **"Enable Events"** to ON
3. **Request URL**: `https://your-domain.com/slack/events` (with `/slack/events` path)
   - Slack will POST a challenge; you must respond with it (our handler does this)
4. Under **"Subscribe to bot events"**, add:
   - `app_mention` (when @AgentDock is mentioned)
   - `message.im` (optional: direct messages)
5. Click **"Save Changes"**

---

## Step 3: Install App & Get Token

1. Go to **"Install App"** (left sidebar)
2. Click **"Install to Workspace"**
3. Authorize the app
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)
5. Save it (you'll need it in `.env`)

---

## Step 4: Set Bot Permissions

1. Go to **"OAuth & Permissions"** (left sidebar)
2. Under **"Scopes"** → **"Bot Token Scopes"**, add:
   - `chat:write` (post messages)
   - `users:read` (get user email)
   - `users:read.email` (read email addresses)
   - `app_mentions:read` (read mentions, implicit with app_mention events)
3. **Reinstall** the app if prompted

---

## Step 5: Update Code

### `.env`

```bash
# Local testing
LOCAL_USER_EMAIL=aainaa@regentmarkets.com
DATA_DIR=./data

# Slack integration
SLACK_BOT_TOKEN=xoxb-your-long-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here

# Server
FASTAPI_ENV=production
```

**Where to get secrets**:
- **Bot Token**: "Install App" page → **Bot User OAuth Token**
- **Signing Secret**: "Basic Information" page → **Signing Secret**

### `src/auth_stub.py` (uncomment Slack integration)

```python
def get_slack_user_email(user_id: str, slack_token: str) -> str:
    """Already implemented! Just needs token from .env"""
    from slack_sdk import WebClient
    client = WebClient(token=slack_token)
    response = client.users_info(user=user_id)
    email = response["user"]["profile"]["email"]
    return email.strip().lower()
```

### `src/api.py` (implement Slack handler)

Replace the stub `@app.post("/slack/events")` with:

```python
import os
import hashlib
import hmac
import time
import json
from slack_sdk import WebClient

@app.post("/slack/events")
async def slack_events_handler(request: dict):
    """
    Slack event webhook handler with thread-aware memory support.
    Validates signature, resolves user email, runs query with thread context, posts reply.
    """
    
    # Step 1: Verify request signature (prevents spoofing)
    signature = request.headers.get("X-Slack-Request-Signature", "")
    timestamp = request.headers.get("X-Slack-Request-Timestamp", "")
    body = await request.body()
    
    if not _verify_slack_signature(signature, timestamp, body):
        raise HTTPException(status_code=403, detail="Invalid signature")
    
    # Step 2: Parse event
    event_data = await request.json()
    
    # Slack sends a challenge on first subscription; respond with it
    if event_data.get("type") == "url_verification":
        return {"challenge": event_data["challenge"]}
    
    # Step 3: Extract event details
    event = event_data.get("event", {})
    if event.get("type") != "app_mention":
        return {"ok": True}  # Ignore other events
    
    user_id = event.get("user")
    channel_id = event.get("channel")
    thread_ts = event.get("thread_ts", event.get("ts"))  # Use thread_ts if exists
    text = event.get("text")
    
    try:
        # Step 4: Resolve user_id → email
        slack_token = os.getenv("SLACK_BOT_TOKEN")
        from auth_stub import get_slack_user_email
        user_email = get_slack_user_email(user_id, slack_token)
        
        # Step 5: Query agent with thread context
        # IMPORTANT: Pass thread_ts to enable thread-specific memory
        query_text = text.replace(f"<@{event_data.get('authorizations', [{}])[0].get('bot_id')}>", "").strip()
        result = agent.query(
            user_email=user_email,
            query_text=query_text,
            thread_id=thread_ts  # ← Thread-aware memory!
        )
        answer = result["answer"]
        
        # Step 6: Post reply in thread
        client = WebClient(token=slack_token)
        client.chat_postMessage(
            channel=channel_id,
            text=answer,
            thread_ts=thread_ts
        )
        
        return {"ok": True}
    
    except Exception as e:
        print(f"[SLACK ERROR] {e}")
        # Optionally post error message to thread
        return {"ok": False, "error": str(e)}


def _verify_slack_signature(signature: str, timestamp: str, body: bytes) -> bool:
    """Verify Slack request signature."""
    slack_signing_secret = os.getenv("SLACK_SIGNING_SECRET", "").encode()
    
    # Slack signs with: timestamp + body
    basestring = f"v0:{timestamp}:{body.decode()}"
    computed_signature = "v0=" + hmac.new(
        slack_signing_secret,
        basestring.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(computed_signature, signature)
```

---

## Step 6: Deploy Server

Choose one:

### Option A: Local Testing (for dev)

```bash
# Terminal 1: Run server (make publicly accessible)
python -m src.api

# Use ngrok or similar to tunnel to public URL
ngrok http 8001
# Copy forwarding URL → paste into Slack app settings /slack/events
```

### Option B: Cloud Deployment (recommended)

#### Google Cloud Run (GCP)

```bash
# 1. Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
ENV PORT=8080
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8080"]
EOF

# 2. Build and push
gcloud builds submit --tag gcr.io/YOUR-PROJECT/claimbot

# 3. Deploy
gcloud run deploy claimbot \
  --image gcr.io/YOUR-PROJECT/claimbot \
  --platform managed \
  --set-env-vars SLACK_BOT_TOKEN=xoxb-... \
  --set-env-vars SLACK_SIGNING_SECRET=... \
  --set-env-vars DATA_DIR=/data  # Or mount volume

# 4. Copy service URL → Slack app settings /slack/events
gcloud run services describe claimbot --platform managed
```

#### Docker Compose (any server)

```yaml
# docker-compose.yml
version: '3.8'
services:
  claimbot:
    build: .
    ports:
      - "8001:8001"
    environment:
      SLACK_BOT_TOKEN: ${SLACK_BOT_TOKEN}
      SLACK_SIGNING_SECRET: ${SLACK_SIGNING_SECRET}
      DATA_DIR: /data
    volumes:
      - ./data:/data

# Run
docker-compose up
# Access at http://localhost:8001
```

---

## Step 7: Test in Slack

1. In your Slack workspace, go to any channel
2. Type: `@AgentDock What's my remaining balance?`
3. Hit Enter
4. Wait ~1 second
5. Bot replies in thread with answer

**If it doesn't work**:
- Check CloudWatch/Logs for errors
- Verify request is reaching your endpoint (add logging)
- Confirm SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET are set
- Check Slack app has correct permissions

---

## Step 8: Customize Responses (Optional)

### Format messages nicer

```python
def format_slack_response(result: dict) -> str:
    """Format agent response for Slack."""
    answer = result["answer"]
    tool = result["tool_used"]
    
    # Add emoji for clarity
    if "sum" in tool.lower():
        return f"💰 {answer}"
    elif "retrieve" in tool.lower():
        return f"📋 {answer}"
    else:
        return answer
```

### Add interactive buttons (optional)

```python
from slack_sdk.models.blocks import Block, Section, Button

# In slack_events_handler, after building answer:
blocks = [
    Section(text={"type": "mrkdwn", "text": answer}),
    # Optional: add action buttons
]

client.chat_postMessage(
    channel=channel_id,
    blocks=blocks,
    thread_ts=thread_ts
)
```

---

## Step 9: Monitor & Debug

### Slack App Logs

In Slack app settings → **"Event Subscriptions"** → scroll down to see recent events and their status (success/failure).

### Server Logs

```bash
# See request details
tail -f /var/log/claimbot.log

# Or in CloudRun:
gcloud run logs read claimbot --limit 50
```

### Test Endpoint

```bash
# Health check
curl https://your-domain.com/health

# Manual query (for testing)
curl -X POST https://your-domain.com/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Show my claims", "user_email": "test@example.com"}'
```

---

## Step 10: Production Hardening

### Security Checklist

- [ ] **SSL/HTTPS**: Use domain with valid certificate
- [ ] **Rate limiting**: Add per-user/per-email rate limits
- [ ] **Logging**: Log queries (masked emails) for audit
- [ ] **Error handling**: Never expose internal errors to Slack
- [ ] **Timeouts**: Set 3s timeout for agent queries (Slack expects fast responses)
- [ ] **Signature verification**: Always verify Slack signature (code does this)
- [ ] **Secrets management**: Use env vars or secret manager (not hardcoded)

### Performance Tuning

```python
# Add timeouts
from asyncio import timeout

@app.post("/slack/events")
async def slack_events_handler(request):
    try:
        async with timeout(3):  # 3 second timeout
            result = agent.query(email, text)
    except asyncio.TimeoutError:
        return {"error": "Query timeout; try again"}
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "No events showing in Slack app" | Request URL unreachable | Check domain is public, firewall allows HTTPS 443 |
| "Event received but bot doesn't respond" | Code error in handler | Check logs; add try/except |
| "Bot responds but with error" | Email not in CSV | Verify user email is in claims_2025.csv (lowercase) |
| "Response very slow" | Agent query is slow | Add timing logs; check CSV size |
| "Signature verification failed" | Wrong signing secret | Copy from Slack app **"Basic Information"** page, not Bot Token |

---

## Rollback Plan

If something breaks in production:

1. **Disable in Slack**: Go to **"Event Subscriptions"** → toggle OFF
2. **Your users** will see app no longer responding (graceful)
3. **Fix code** and test locally
4. **Re-enable** when ready

---

## Next: Enhancements

Once basic Slack integration works:

- [ ] Add slash commands (e.g., `/claim-balance`)
- [ ] Support threaded conversations (remember context)
- [ ] Add "export as PDF" button
- [ ] Integrate with Zapier/Make for even richer automation
- [ ] Add scheduled reports (e.g., weekly digest)

---

## Appendix: Slack API Reference

**Useful endpoints used by ClaimBot**:
- `users.info`: Get user profile (including email)
- `chat.postMessage`: Send message to channel/thread
- `chat.update`: Edit existing message
- `users.list`: List all users (for bulk operations)

**Docs**: [Slack API Docs](https://api.slack.com/methods)

---

## Checklist

Ready to deploy?

- [ ] Slack app created at api.slack.com/apps
- [ ] `app_mention` event subscription enabled
- [ ] Bot User OAuth Token copied to `.env` (SLACK_BOT_TOKEN)
- [ ] Signing Secret copied to `.env` (SLACK_SIGNING_SECRET)
- [ ] Permissions set: `chat:write`, `users:read`, `users:read.email`
- [ ] Server publicly accessible (with HTTPS)
- [ ] `/slack/events` handler implemented in `src/api.py`
- [ ] Request URL verified by Slack (no challenge errors)
- [ ] Test message sent in Slack and bot replied
- [ ] Monitoring/logging configured

---

**Questions?** Refer to:
- [Slack API Docs](https://api.slack.com)
- Architecture doc: `ARCHITECTURE.md`
- Code: `src/api.py` and `src/auth_stub.py`

Good luck! 🚀
