# 🚀 ClaimBot Quick Reference

**Everything you need in one place!**

---

## 📝 Start Server & ngrok (2 Commands)

### **Terminal 1: Start Server**
```bash
cd /Users/aidillfitri/Documents/Work/AI\ Agent/ClaimEase/project/codebase/claim-ai-agent
./start_server.sh
```

**Expected output:**
```
🚀 Starting ClaimBot API Server
✅ Environment variables loaded
Starting server on port 8000...

INFO:     Started server process
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Keep this terminal running!**

---

### **Terminal 2: Start ngrok** (Open NEW terminal)
```bash
~/ngrok http 8000
```

**Expected output:**
```
Session Status                online
Forwarding                    https://YOUR-URL.ngrok-free.dev -> http://localhost:8000
```

✅ **Keep this terminal running!**
✅ **Copy the HTTPS URL** (you'll need it for Slack)

---

## 🛑 Stop Everything

**Terminal 1:** Press `Ctrl+C`
**Terminal 2:** Press `Ctrl+C`

---

## 🔄 Restart (If Needed)

**Just run the same 2 commands again:**

**Terminal 1:**
```bash
./start_server.sh
```

**Terminal 2:**
```bash
~/ngrok http 8000
```

**Note:** ngrok URL changes each restart (free tier)

---

## ⚙️ Configure Slack (One-Time Setup)

### **Step 1: Go to Slack App Settings**
1. Open: https://api.slack.com/apps
2. Click your app

### **Step 2: Add Required Scopes**
1. Click **"OAuth & Permissions"** (left sidebar)
2. Scroll to **"Bot Token Scopes"**
3. Ensure these scopes are added:
   - `app_mentions:read` - Read @mentions
   - `chat:write` - Send messages
   - `users:read` - View users
   - `users:read.email` - View user emails
   - `im:write` - Send DMs (for privacy feature)
   - `im:history` - Read DMs
4. If you added new scopes, click **"Reinstall to Workspace"**

### **Step 3: Configure Event Subscriptions**
1. Click **"Event Subscriptions"** (left sidebar)
2. Toggle **"Enable Events"** to **ON**
3. **Request URL:** `https://YOUR-NGROK-URL/slack/events`
   - Example: `https://abc123.ngrok-free.dev/slack/events`
4. Wait for **"Verified ✓"** (2-3 seconds)
5. Scroll to **"Subscribe to bot events"**
6. **Add these events:**
   - ✅ `app_mention` - Respond to @mentions
   - ✅ `message.im` - Handle DMs (for privacy feature)
7. **Remove if present:**
   - ❌ `message.groups` (causes duplicates)
8. Click **"Save Changes"**

✅ **Done!**

---

## 🧪 Test Bot in Slack

### **Basic Test:**
```
@YourBot hello
```

### **Claim Queries (PII - Sent to DM):**
```
@YourBot what's my balance?
@YourBot show my claims
@YourBot how many claims this year?
@YourBot what's my total claim amount?
```

**🔒 Privacy Feature:**
- Questions about balances, claims, amounts → Bot sends answer to your DM
- Thread shows: "🔒 Your inquiry has been sent to your DM for privacy"
- Protects your personal financial information!

### **Policy Questions (Public - Replied in Thread):**
```
@YourBot what's covered under medical?
@YourBot how do I submit a claim?
@YourBot what's the claim limit?
```

**📢 Public Responses:**
- General policy questions → Bot replies in thread
- No personal data involved
- Everyone can see the answer

### **Thread Conversations:**
```
You: @YourBot what's my balance?
Bot: 🔒 Your inquiry has been sent to your DM for privacy
[Check your DMs for the actual balance]

You: @YourBot how do I submit a claim?
Bot: [Replies in thread with instructions]
```

### **Direct Messages:**
```
DM to @YourBot: what's my balance?
Bot: [Replies in DM with your balance]
```

**💡 Pro Tip:** You can also DM the bot directly for private conversations!

---

## ✅ Health Check

### **Check if server is running:**
Open in browser:
```
http://localhost:8000/health
```

**Should return:**
```json
{
  "status": "healthy",
  "agent": "ready",
  "memory": {
    "active_threads": 0,
    "total_messages": 0,
    "unique_users": 0
  }
}
```

---

## 🔧 Troubleshooting

### **Problem: Bot not responding**

**Check 1: Are both terminals running?**
- Terminal 1: Server running?
- Terminal 2: ngrok running?

**Check 2: Event Subscriptions configured?**
- Go to Slack app settings
- Event Subscriptions enabled?
- URL verified with ✓?
- Only `app_mention` subscribed?

**Check 3: Bot invited to channel?**
- Type `@YourBot` in channel
- Click "Invite to Channel" if prompted

---

### **Problem: Multiple duplicate responses**

**Fix: Check event subscriptions**
1. Go to Slack app → Event Subscriptions
2. Should have: `app_mention` and `message.im`
3. Remove if present: `message.groups`
4. Save Changes

**Note:** `message.im` is needed for the privacy DM feature!

---

### **Problem: "Method Not Allowed" error**

**This is normal!** Those endpoints are POST-only.
- `/query` - POST endpoint (not for browser)
- `/slack/events` - POST endpoint (not for browser)

**Use `/health` for browser testing instead!**

---

### **Problem: ngrok URL changed**

**This happens when you restart ngrok (free tier)**

**Fix:**
1. Copy new ngrok URL
2. Update Slack Event Subscriptions
3. Paste new URL: `https://NEW-URL/slack/events`
4. Wait for "Verified ✓"
5. Save Changes

---

## 📁 Important Files

### **Configuration:**
- `config/.env` - API keys and tokens
- `config/.env.example` - Template

### **Scripts:**
- `start_server.sh` - Start server
- `setup_ngrok.sh` - Download ngrok

### **Documentation:**
- `QUICK_REFERENCE.md` - This file!
- `QUICKSTART_COMMANDS.md` - Detailed setup
- `SLACK_SETUP_GUIDE.md` - Full Slack guide
- `EASY_SETUP.md` - Step-by-step setup

### **Code:**
- `src/api.py` - FastAPI server
- `src/ai_agent.py` - AI agent logic
- `src/tools.py` - Database & knowledge tools

---

## 🎯 Common Workflows

### **Daily Development:**
```bash
# Terminal 1
./start_server.sh

# Terminal 2
~/ngrok http 8000

# Test in Slack
@YourBot hello
```

### **After Updating .env:**
```bash
# Terminal 1: Stop server (Ctrl+C)
./start_server.sh

# Terminal 2: Keep ngrok running (no restart needed)
```

### **After Code Changes:**
```bash
# Terminal 1: Stop server (Ctrl+C)
./start_server.sh

# Terminal 2: Keep ngrok running
```

### **Switching Workspaces:**
1. Update `config/.env` with new tokens
2. Restart server (Terminal 1)
3. Update Slack Event Subscriptions with ngrok URL
4. Test

---

## 📊 What's Running Where

**Terminal 1: Server**
- Port: 8000
- Endpoints:
  - `http://localhost:8000/health`
  - `http://localhost:8000/query`
  - `http://localhost:8000/slack/events`

**Terminal 2: ngrok**
- Tunnels port 8000 to internet
- Public URL: `https://YOUR-URL.ngrok-free.dev`
- Web interface: `http://127.0.0.1:4040`

**Slack:**
- Sends events to: `https://YOUR-URL.ngrok-free.dev/slack/events`
- Bot responds in threads

---

## 💡 Pro Tips

### **Keep Terminals Open**
- Don't close terminals while testing
- Both must run simultaneously
- Use separate terminal windows/tabs

### **ngrok URL Stability**
- Free tier: URL changes each restart
- Keep ngrok running to maintain same URL
- Paid tier: Get permanent URL

### **Event Subscriptions**
- Subscribe to: `app_mention` and `message.im`
- Remove: `message.groups` (causes duplicates)
- Bot works in all channels when @mentioned
- DMs enabled for privacy-sensitive responses

### **Testing**
- Always @mention the bot
- Bot replies in threads
- Each thread has separate context

### **Logs**
- Terminal 1 shows server logs
- Terminal 2 shows ngrok traffic
- Check logs for debugging

---

## 🎉 Quick Start Summary

**3 steps to get running:**

1. **Start server & ngrok** (2 commands)
   ```bash
   ./start_server.sh
   ~/ngrok http 8000
   ```

2. **Configure Slack** (one-time)
   - Add required scopes (including `im:write` and `im:history`)
   - Event Subscriptions: `app_mention` + `message.im`
   - Add ngrok URL
   - Reinstall if needed

3. **Test in Slack**
   ```
   @YourBot hello
   @YourBot what's my balance?  (🔒 sent to DM)
   ```

**Total time: ~5 minutes**

---

## 🔒 Privacy Feature

**How it works:**

1. **PII Queries** (balance, claims, amounts):
   - Bot detects sensitive data request
   - Sends detailed answer to your DM
   - Posts acknowledgment in thread: "🔒 Sent to your DM"

2. **General Queries** (policies, procedures):
   - Bot replies in thread
   - Everyone can see the answer
   - No personal data involved

**PII Keywords Detected:**
- balance, my balance, remaining balance
- claim amount, my claim, my claims
- how much, total spent, total claim
- claim history, claim records, claim details
- spent, claimed, reimbursed

**Benefits:**
- ✅ Protects your personal financial data
- ✅ Prevents others from seeing your claim amounts
- ✅ Complies with data privacy best practices
- ✅ You can still ask in public channels safely!

---

## 📞 Need Help?

**Check these in order:**
1. Both terminals running?
2. `/health` endpoint working?
3. Event Subscriptions configured?
4. Only `app_mention` subscribed?
5. Bot invited to channel?

**Still stuck?** Check server logs in Terminal 1 for errors.

---

**Happy testing!** 🚀
