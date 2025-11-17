# 🔥 Firewall Fix for Network Sharing

## Issue: Team can't access your local app on same network

## 🚀 STEP-BY-STEP SOLUTION

### Step 1: Test Current Setup
Your app is currently running. Have your teammate try:
```
http://10.10.24.121:8080
```

If it works → ✅ You're done!  
If it doesn't work → Continue to Step 2

### Step 2: Fix Firewall (Choose ONE option)

### Manual Firewall Fix (macOS):

#### Option 1: System Preferences
1. **Apple Menu** → **System Preferences** → **Security & Privacy**
2. Click **Firewall** tab
3. Click **🔒 Lock icon** (enter password)
4. Click **Turn Off Firewall** (temporarily) OR
5. Click **Firewall Options...**
6. Click **+** button
7. Find and add **Node.js** and **Terminal**
8. Set both to **Allow incoming connections**

#### Option 2: Terminal Commands
```bash
# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Allow Node.js through firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

#### Option 3: Network Location (Easiest)
1. **Apple Menu** → **System Preferences** → **Network**
2. Click **Location** dropdown → **Edit Locations...**
3. Click **+** → Name it "Office/Home Network"
4. Switch to this location
5. This often bypasses firewall restrictions

### Step 3: Test After Firewall Fix
After fixing firewall, have your teammate try the URL again:
```
http://10.10.24.121:8080
```

### Step 4: If Still Not Working - Deploy to Vercel

#### Terminal Commands (run these in order):
```bash
# 1. Stop current server (Ctrl+C in the terminal running npm)

# 2. Login to Vercel (opens browser)
vercel login

# 3. Deploy your app
vercel --prod --yes

# 4. You'll get a permanent public URL like:
# https://claimease-abc123.vercel.app
```

#### What you need to do for Vercel:
1. **Open browser** when prompted
2. **Sign up/login** with GitHub account
3. **Wait for deployment** (2-3 minutes)
4. **Share the final URL** with your team

### Alternative Ports to Try:
```bash
# Port 8080 (HTTP alternative)
npm run dev -- --hostname 0.0.0.0 --port 8080
# Share: http://10.10.24.121:8080

# Port 8000 (common alternative)  
npm run dev -- --hostname 0.0.0.0 --port 8000
# Share: http://10.10.24.121:8000

# Port 9000 (another common port)
npm run dev -- --hostname 0.0.0.0 --port 9000
# Share: http://10.10.24.121:9000
```

### Router/Network Issues:
If ports still blocked, your router might have **client isolation** enabled:
1. **Router Settings** → **Wireless Security** 
2. **Disable "AP Isolation"** or **"Client Isolation"**
3. Or connect via **Ethernet** instead of WiFi

### Quick Test Command:
Have your teammate try:
```bash
ping 10.10.24.121
```
If ping fails, it's a network/router issue.
If ping works but HTTP fails, it's a firewall issue.

---

**Current Status:**
- ✅ Server is running on: http://10.10.24.121:8080
- 🔍 Test this URL with your team first