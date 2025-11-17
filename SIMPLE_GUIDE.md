# 🎯 SIMPLE GUIDE - How to Run Your Server

## For LOCAL Testing (Just You)

This is what you should use 99% of the time:

### Step 1: Start Backend
```bash
python3 src/api.py
```
✅ Backend runs on: `http://localhost:8001`

### Step 2: Start Frontend
```bash
npm run dev
```
✅ Frontend runs on: `http://localhost:3000`

### Step 3: Open Browser
Go to: `http://localhost:3000`

**That's it! Everything works locally.**

---

## For SHARING with Others (Advanced)

⚠️ **ONLY do this when you want to share with someone else!**

### The Problem:
- Your backend is on `localhost:8001` (only you can access)
- Your frontend is on `localhost:3000` (only you can access)
- Others can't access `localhost` from their computers!

### The Solution (ngrok):
ngrok creates public URLs that point to your localhost.

### How It Works:

```
Your Computer:
├── Backend: localhost:8001
│   └── ngrok creates: https://abc123.ngrok.io → localhost:8001
│
└── Frontend: localhost:3000
    └── ngrok creates: https://xyz789.ngrok.io → localhost:3000
```

### Steps to Share:

1. **Make sure backend and frontend are running**
   ```bash
   # Terminal 1
   python3 src/api.py
   
   # Terminal 2
   npm run dev
   ```

2. **Start ngrok for backend**
   ```bash
   # Terminal 3
   ~/ngrok http 8001
   ```
   Copy the URL (e.g., `https://abc123.ngrok.io`)

3. **Update .env.local with backend ngrok URL**
   ```bash
   echo "NEXT_PUBLIC_API_URL=https://abc123.ngrok.io" > .env.local
   ```

4. **Restart frontend**
   ```bash
   # In Terminal 2, press Ctrl+C, then:
   npm run dev
   ```

5. **Start ngrok for frontend**
   ```bash
   # Terminal 4
   ~/ngrok http 3000
   ```
   Copy the URL (e.g., `https://xyz789.ngrok.io`)

6. **Share the FRONTEND URL**
   Give `https://xyz789.ngrok.io` to others

### When Done Sharing:

1. **Stop ngrok** (Ctrl+C in terminals 3 and 4)

2. **Reset .env.local back to localhost**
   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local
   ```

3. **Restart frontend**
   ```bash
   npm run dev
   ```

Now you're back to local-only mode!

---

## Common Mistakes

### ❌ WRONG: Using ngrok URL without ngrok running
```
.env.local: NEXT_PUBLIC_API_URL=https://abc123.ngrok.io
Backend: Running on localhost:8001 (no ngrok)
Result: ERROR - Can't connect!
```

### ✅ CORRECT: Localhost for local testing
```
.env.local: NEXT_PUBLIC_API_URL=http://localhost:8001
Backend: Running on localhost:8001
Result: Works perfectly!
```

### ✅ CORRECT: ngrok URL with ngrok running
```
.env.local: NEXT_PUBLIC_API_URL=https://abc123.ngrok.io
Backend: localhost:8001 + ngrok tunnel running
Result: Works for sharing!
```

---

## Quick Reference

### Current Setup (Local Only):
- `.env.local`: `http://localhost:8001` ✅
- Backend: `python3 src/api.py` on port 8001 ✅
- Frontend: `npm run dev` on port 3000 ✅
- Access: `http://localhost:3000` ✅

**This is all you need for development!**

### When to Use ngrok:
- ❌ NOT for daily development
- ❌ NOT for testing
- ✅ ONLY when sharing with someone else
- ✅ ONLY for demos/presentations

---

## Need Help?

**For local testing:** Just run backend + frontend. That's it!

**For sharing:** Follow the "Steps to Share" section above carefully.

**Still confused?** Just use localhost. You don't need ngrok unless you're sharing!
