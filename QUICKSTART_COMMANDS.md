# 🚀 Quick Start - Just 3 Commands!

**Everything is set up! Here's exactly what to do:**

---

## ✅ What's Already Done

- ✅ Server code ready
- ✅ Dependencies installed
- ✅ ngrok downloaded and configured
- ✅ Slack tokens in config/.env
- ✅ Scripts fixed and ready

---

## 📝 Commands to Run

### **Terminal 1: Start the Server**

```bash
./start_server.sh
```

**Expected output:**
```
🚀 Starting ClaimBot API Server
✅ Environment variables loaded
Starting server on port 8000...

INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

✅ **Keep this terminal running!**

---

### **Terminal 2: Start ngrok**

Open a NEW terminal and run:

```bash
~/ngrok http 8000
```

**Expected output:**
```
Session Status                online
Forwarding                    https://abc123.ngrok.io -> http://localhost:8000
```

✅ **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

---

### **Browser: Configure Slack**

1. Go to https://api.slack.com/apps
2. Click your ClaimBot app
3. Click **"Event Subscriptions"**
4. Toggle **"Enable Events"** to ON
5. **Request URL:** Paste `https://YOUR_NGROK_URL/slack/events`
   - Example: `https://abc123.ngrok.io/slack/events`
6. Wait for **"Verified ✓"** checkmark
7. Click **"Save Changes"**

---

### **Slack: Test It!**

Go to any Slack channel and type:

```
@ClaimBot hello
```

**Bot should reply in ~2 seconds!** 🎉

---

## 🎯 Summary

**That's it! Just 3 steps:**

1. `./start_server.sh` (Terminal 1 - keep running)
2. `~/ngrok http 8000` (Terminal 2 - keep running)
3. Configure Slack with ngrok URL

**Total time: ~3 minutes**

---

## 🔍 Quick Checks

### Is the server running?
```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "agent": "ready"
}
```

### Is ngrok working?
Look at Terminal 2 - you should see the HTTPS URL

### Is Slack configured?
You should see "Verified ✓" in Slack Event Subscriptions

---

## 🎉 You're Done!

Your ClaimBot is now:
- ✅ Running locally
- ✅ Exposed via ngrok
- ✅ Connected to Slack
- ✅ Ready to answer questions!

**Test it in Slack now!** 🚀

---

## 📊 What to Expect

### Server logs (Terminal 1):
```
INFO:     POST /slack/events
[AI AGENT] Query from u***@regentmarkets.com: hello
[AI AGENT] Response generated
```

### ngrok logs (Terminal 2):
```
POST /slack/events    200 OK
```

### Slack:
- You: `@ClaimBot hello`
- Bot: Replies in thread within 2 seconds

---

## 🛑 To Stop

**Terminal 1:** Press `Ctrl+C`
**Terminal 2:** Press `Ctrl+C`

---

## 🔄 To Restart

Just run the same 2 commands again:
```bash
./start_server.sh
~/ngrok http 8000
```

**Note:** ngrok URL changes each time, so update Slack with new URL!

---

**Need help? Check server logs in Terminal 1 - they show everything!**
