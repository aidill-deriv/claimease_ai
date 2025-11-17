# 🚀 Deployment Guide - ClaimEase Web App

This guide provides multiple options for sharing your local ClaimEase app with team members.

## 📱 Current Working Solution: Same Network Access

**✅ Status: WORKING**  
**Use Case:** Team members on same WiFi/office network

### Commands:
```bash
# 1. Start backend
python3 src/api.py

# 2. Start frontend with network access
npm run dev -- --hostname 0.0.0.0

# 3. Share this URL with your team:
http://10.10.24.121:3000
```

### Requirements:
- ✅ All team members must be on the same WiFi network
- ✅ Your computer must stay connected and servers running
- ✅ Firewall should allow incoming connections (usually automatic)

---

## 🌐 Alternative Solutions

### Option 1: Vercel Deployment (Universal Access)

**Use Case:** Remote team members, permanent deployment

#### Setup Commands:
```bash
# Install Vercel CLI (already done)
npm install -g vercel

# Deploy to Vercel
vercel --prod
```

#### What happens:
1. Vercel will ask you to login (creates account automatically)
2. It builds and deploys your Next.js app
3. You get a permanent public URL (e.g., `https://claimease-abc123.vercel.app`)
4. Works from anywhere in the world

#### Notes:
- **Frontend only** - you'll need to deploy the Python backend separately
- **Free tier available** with generous limits
- **Automatic HTTPS** and global CDN
- **Custom domain** support

#### Backend Deployment Options for Vercel:
- **Railway.app** (recommended for Python FastAPI)
- **Render.com** (free tier available)
- **Heroku** (paid)

### Option 2: Cloudflare Pages + Railway

**Use Case:** Full-stack deployment with free tiers

#### Frontend (Cloudflare Pages):
```bash
# Build the app
npm run build

# Connect to Cloudflare Pages via GitHub
# Auto-deploys on git push
```

#### Backend (Railway):
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy Python backend
railway login
railway init
railway up
```

### Option 3: Tunneling Services (Temporary Access)

**Use Case:** Quick sharing, development testing

#### Working Options:
```bash
# Cloudflare Tunnel (most reliable)
npx cloudflared tunnel --url http://localhost:3000

# LocalTunnel (backup)
npm install -g localtunnel
lt --port 3000

# Serveo (SSH-based)
ssh -R 80:localhost:3000 serveo.net
```

#### Failed Options (documented for reference):
- ❌ ngrok (connection issues with free tier)
- ❌ Bore.pub (download issues)
- ❌ Pinggy (DNS resolution issues)

---

## 🔧 Deployment Preparation

### Before Deploying to Production:

#### 1. Environment Variables Setup
Create production environment files:
```bash
# For Vercel (create vercel.json)
{
  "env": {
    "NEXT_PUBLIC_API_URL": "https://your-backend-url.com"
  }
}

# For Railway (backend)
OPENAI_API_KEY=your-key-here
DATABASE_URL=your-database-url
```

#### 2. Update API Configuration
```javascript
// next.config.js - update for production
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://your-backend-url.railway.app/:path*'
          : 'http://localhost:8001/:path*',
      },
    ]
  },
}
```

#### 3. Database Migration
```bash
# Prepare database for production
python3 src/db_setup.py data database/claims.db

# Or use cloud database (PostgreSQL recommended for production)
```

---

## 📋 Quick Reference

### Same Network (Current Working Solution)
```bash
npm run dev -- --hostname 0.0.0.0
# Share: http://10.10.24.121:3000
```

### Vercel Deployment (Next Time)
```bash
vercel --prod
# Get permanent public URL
```

### Tunneling (Temporary)
```bash
npx cloudflared tunnel --url http://localhost:3000
# Get temporary public URL
```

---

## 🚨 Troubleshooting

### Common Issues:

#### "Site can't be reached" on same network:
```bash
# Check if Next.js is binding to all interfaces
netstat -an | grep 3000
# Should show: *.3000 not 127.0.0.1:3000

# Fix: Restart with hostname flag
npm run dev -- --hostname 0.0.0.0
```

#### Backend API not accessible:
```bash
# Update next.config.js API destination to use local IP
destination: 'http://10.10.24.121:8001/:path*'
```

#### Firewall blocking connections:
```bash
# macOS: System Preferences > Security & Privacy > Firewall
# Allow Node.js and Python through firewall
```

### Port Conflicts:
```bash
# Check what's using ports
lsof -i :3000
lsof -i :8001

# Kill process if needed
kill -9 <PID>
```

---

## 📈 Deployment Recommendations

### For Development/Testing:
1. **Same Network** (current working solution)
2. **Cloudflare Tunnel** (if remote access needed)

### For Production:
1. **Frontend:** Vercel (easiest) or Cloudflare Pages
2. **Backend:** Railway.app or Render.com
3. **Database:** PostgreSQL on Railway or Supabase

### For Enterprise:
1. **AWS/Azure/GCP** with container deployment
2. **Docker + Kubernetes** for scaling
3. **Dedicated database** servers

---

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

---

**Last Updated:** November 7, 2025  
**Current Status:** Same network solution working ✅  
**Next Step:** Deploy to Vercel when needed

---

*This guide will be updated as new deployment methods are tested and verified.*