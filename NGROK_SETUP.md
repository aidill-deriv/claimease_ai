# 🌐 ngrok Setup Guide - Share Your Server Publicly

This guide helps you share your ClaimEase server with others while still using localhost yourself.

## Quick Start

### 1. Configure ngrok (One-time setup)

```bash
# Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken
~/ngrok config add-authtoken YOUR_TOKEN_HERE
```

### 2. Start Everything

```bash
# Terminal 1: Backend API
python3 src/api.py

# Terminal 2: Frontend
npm run dev

# Terminal 3: ngrok Tunnels (automated)
./start_with_ngrok.sh
```

The script will:
- ✅ Start ngrok tunnels for both backend and frontend
- ✅ Automatically update `.env.local` with the backend URL
- ✅ Display both localhost and public URLs
- ✅ Keep tunnels running until you press Ctrl+C

## Access URLs

### For You (Local Development)
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8001`
- Fast and no internet required!

### For Others (Public Sharing)
- Share the **Frontend ngrok URL** (e.g., `https://xyz789.ngrok.io`)
- They can access from anywhere in the world!

### ngrok Dashboard
- View tunnel status: `http://localhost:4040`
- See all requests, inspect traffic, replay requests

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    Your Computer                         │
│                                                          │
│  Backend (8001) ←→ Frontend (3000)                      │
│       ↓                    ↓                             │
│  ngrok tunnel         ngrok tunnel                       │
│       ↓                    ↓                             │
└───────┼────────────────────┼─────────────────────────────┘
        ↓                    ↓
   Internet Cloud       Internet Cloud
        ↓                    ↓
   Backend URL          Frontend URL
   (internal)           (share this!)
```

## Important Notes

⚠️ **Free ngrok limitations:**
- URLs change every time you restart ngrok
- Limited to 40 connections/minute
- Sessions expire after 2 hours

✅ **Best practices:**
- Keep your computer on while sharing
- Don't share sensitive data on free tier
- For production, deploy to cloud (Vercel, Railway, etc.)

## Troubleshooting

### "Endpoint already online" error
```bash
# Kill existing ngrok processes
pkill -f ngrok

# Then restart
./start_with_ngrok.sh
```

### Frontend can't connect to backend
1. Check `.env.local` has the correct backend ngrok URL
2. Restart frontend: `npm run dev`
3. Make sure backend is running on port 8001

### Can't access ngrok dashboard
- Make sure ngrok is running
- Visit: `http://localhost:4040`

## Alternative: Manual Setup

If you prefer manual control:

```bash
# Terminal 1: Backend
python3 src/api.py

# Terminal 2: Frontend  
npm run dev

# Terminal 3: Backend tunnel
~/ngrok http 8001

# Terminal 4: Frontend tunnel
~/ngrok http 3000
```

Then manually update `.env.local` with the backend URL and restart frontend.

## Stop Sharing

Press `Ctrl+C` in the terminal running `start_with_ngrok.sh`

This will:
- Stop ngrok tunnels
- Keep your backend and frontend running locally
- Revert to localhost-only access
