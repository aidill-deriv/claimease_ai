# 🚀 WHAT TO RUN NOW - Sequential Guide

## Current Status:
- ✅ Your backend is running: `python3 src/api.py`
- ✅ Your frontend is running: `npm run dev -- --hostname 0.0.0.0 --port 8080`
- 🔍 Testing URL: `http://10.10.24.121:8080`

---

## 📋 STEP 1: Test Current URL

**Ask your teammate to try this URL:**
```
http://10.10.24.121:8080
```

### If it works → ✅ DONE! Share with your team!
### If it doesn't work → Continue to STEP 2

---

## 📋 STEP 2: Quick Firewall Fix

**Choose ONE option:**

### Option A: Disable Firewall (Quickest)
1. **Apple Menu** → **System Preferences** → **Security & Privacy**
2. Click **Firewall** tab
3. Click **🔒** (enter password)
4. Click **Turn Off Firewall**
5. Test the URL again: `http://10.10.24.121:8080`

### Option B: Allow Node.js (Safer)
1. **Apple Menu** → **System Preferences** → **Security & Privacy**
2. Click **Firewall** tab → **Firewall Options**
3. Click **+** → Find **Node.js** → **Allow incoming connections**
4. Test the URL again: `http://10.10.24.121:8080`

---

## 📋 STEP 3: If Firewall Fix Didn't Work - Deploy to Vercel

**Run these commands in your terminal:**

```bash
# 1. Stop your current npm server (press Ctrl+C in that terminal)

# 2. Login to Vercel
vercel login
```

**When browser opens:**
1. Sign up/login with **GitHub account**
2. Return to terminal
3. Press **Enter** to continue

```bash
# 3. Deploy your app
vercel --prod --yes
```

**Wait 2-3 minutes for deployment...**

**You'll get a URL like:** `https://claimease-abc123.vercel.app`

**Share this URL** with your team - it works from anywhere!

---

## 📋 STEP 4: Update Backend Connection (For Vercel)

**If you deployed to Vercel, your frontend won't connect to your local backend.**

### Quick Fix - Update next.config.js:
```javascript
// Change line 8 in next.config.js from:
destination: 'http://localhost:8000/:path*',

// To:
destination: 'http://10.10.24.121:8001/:path*',
```

**Then redeploy:**
```bash
vercel --prod --yes
```

---

## 🎯 RECOMMENDED FLOW:

1. **Try Step 1** (test current URL)
2. **If fails → Try Step 2** (disable firewall quickly)  
3. **If still fails → Go to Step 3** (deploy to Vercel)
4. **If Vercel deployed → Do Step 4** (fix backend connection)

---

## 🆘 CURRENT COMMANDS RUNNING:

**Terminal 1:**
```bash
python3 src/api.py
# Keep this running!
```

**Terminal 2:**
```bash
npm run dev -- --hostname 0.0.0.0 --port 8080
# Keep this running (unless you deploy to Vercel)
```

**Share URL:** `http://10.10.24.121:8080`

---

**📱 Need Help? Check:**
- FIREWALL_FIX.md (detailed troubleshooting)
- DEPLOYMENT_GUIDE.md (all deployment options)