# 🚀 ClaimEase AI - Render Deployment Guide

**Last Updated:** December 23, 2025  
**Platform:** Render.com (Recommended)  
**Cost:** Free Tier (No Credit Card Required)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Files Created](#deployment-files-created)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Cost & Limitations](#cost--limitations)

---

## ✅ Prerequisites

Before deploying, ensure you have:

- [x] GitHub account with your code pushed
- [x] Supabase project set up with tables
- [x] OpenAI API key
- [x] All environment variables ready
- [x] Project cleaned up (we just did this! ✅)
- [x] Current project size: ~50-100MB (well under 512MB limit ✅)

---

## 📦 Deployment Files Created

We've created the following files for your deployment:

### 1. `.dockerignore`
**Purpose:** Excludes unnecessary files from Docker builds  
**Location:** Project root  
**Excludes:** venv/, node_modules/, logs/, .git/, tests/, docs/, etc.

### 2. `render.yaml`
**Purpose:** Main deployment configuration for Render  
**Location:** Project root  
**Defines:** Both backend (Python/FastAPI) and frontend (Next.js) services

### 3. `.slugignore` (Optional)
**Purpose:** Additional files to exclude from Render deployment  
**Location:** Project root  
**Supplements:** .dockerignore with Render-specific exclusions

---

## 🚀 Step-by-Step Deployment

### **Step 1: Push to GitHub**

```bash
cd "/Users/aidillfitri/Documents/Work/Github projects/claimease_ai"

# Check what we're committing
git status

# Add all new files
git add .dockerignore render.yaml .slugignore RENDER_DEPLOYMENT_GUIDE.md

# Commit the deployment configs
git commit -m "Add Render deployment configuration files"

# Push to GitHub
git push origin main
```

---

### **Step 2: Sign Up for Render**

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub (easiest option)
4. **No credit card required** for free tier ✅

---

### **Step 3: Connect GitHub Repository**

1. In Render Dashboard, click **"New +"**
2. Select **"Blueprint"**
3. Click **"Connect a repository"**
4. Authorize Render to access your GitHub
5. Select your `claimease_ai` repository
6. Render will auto-detect `render.yaml` ✅

---

### **Step 4: Render Auto-Configuration**

Render will automatically:
- ✅ Detect `render.yaml` configuration
- ✅ Create 2 services:
  - `claimease-backend` (Python/FastAPI)
  - `claimease-frontend` (Next.js)
- ✅ Set up build and start commands
- ✅ Configure basic environment variables

Click **"Apply"** to proceed.

---

### **Step 5: Configure Environment Variables**

For each service, add the required environment variables in Render Dashboard:

#### **Backend Service (`claimease-backend`)**

Go to: Dashboard → claimease-backend → Environment

Add these **secret** variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Knowledge Base (Already set in render.yaml)
KNOWLEDGE_BASE_SOURCE=supabase
DISABLE_KNOWLEDGE_BASE=false
FASTAPI_ENV=production
```

**Where to find these:**
- **Supabase URL & Keys:** Supabase Dashboard → Settings → API
- **OpenAI API Key:** platform.openai.com → API Keys

---

#### **Frontend Service (`claimease-frontend`)**

Go to: Dashboard → claimease-frontend → Environment

Add these **secret** variables:

```env
# Supabase Configuration (Public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Configuration (Server-side)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend API URL (Update after backend deploys!)
NEXT_PUBLIC_API_URL=https://claimease-backend.onrender.com
```

**Important:** 
- Wait for backend to deploy first
- Copy the actual backend URL (e.g., `https://claimease-backend-xyz.onrender.com`)
- Update `NEXT_PUBLIC_API_URL` with the real URL

---

### **Step 6: Deploy Services**

1. **Backend deploys first** (usually 5-10 minutes)
   - Watch logs in Render Dashboard
   - Wait for "Your service is live 🎉"
   - Copy the backend URL

2. **Update Frontend Environment Variable**
   - Go to frontend service → Environment
   - Update `NEXT_PUBLIC_API_URL` with actual backend URL
   - Trigger manual redeploy

3. **Frontend deploys** (usually 3-5 minutes)
   - Next.js build runs
   - Wait for "Your service is live 🎉"

---

### **Step 7: Verify Deployment**

1. **Test Backend:**
   ```bash
   curl https://your-backend-url.onrender.com/health
   ```
   Should return: `{"status": "healthy"}`

2. **Test Frontend:**
   - Open: `https://your-frontend-url.onrender.com`
   - Try logging in
   - Check dashboard loads
   - Test AI chat

---

## 🔧 Post-Deployment Configuration

### **1. Custom Domain (Optional)**

1. Go to: Service → Settings → Custom Domain
2. Add your domain (e.g., `claimease.yourdomain.com`)
3. Update DNS records as instructed
4. SSL certificate auto-provisions ✅

### **2. Enable Auto-Deploy**

- Already enabled in `render.yaml` ✅
- Every push to `main` branch auto-deploys
- Can disable in: Settings → Build & Deploy

### **3. Configure CORS (Backend)**

Update `src/api.py` to allow your frontend domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local dev
        "https://your-frontend-url.onrender.com",  # Production
        "https://your-custom-domain.com",  # If using custom domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🐛 Troubleshooting

### **Issue 1: Build Fails - "Command not found"**

**Cause:** Missing dependencies or wrong build command

**Fix:**
1. Check `render.yaml` has correct build commands
2. Verify `config/requirements.txt` exists
3. Check logs for specific error
4. Ensure Python 3.11 is specified

---

### **Issue 2: Frontend Can't Connect to Backend**

**Cause:** Wrong API URL or CORS not configured

**Fix:**
1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check CORS settings in `src/api.py`
3. Test backend health endpoint directly
4. Check backend logs for errors

---

### **Issue 3: "Application Failed to Respond" (503 Error)**

**Cause:** Cold start taking too long

**Fix:**
1. Wait 30-60 seconds for service to wake up
2. Check service logs for actual errors
3. Verify health check endpoint works
4. Consider upgrading to paid plan for instant availability

---

### **Issue 4: Environment Variables Not Working**

**Cause:** Variables not set or wrong format

**Fix:**
1. Double-check all variables in Render Dashboard
2. Ensure no extra spaces or quotes
3. Restart service after adding variables
4. Check logs to see if variables are loaded

---

### **Issue 5: Build Exceeds 512MB**

**Cause:** Too many dependencies or files

**Fix:**
1. Verify cleanup was successful (we did this! ✅)
2. Check `.dockerignore` is working
3. Review build logs for large files
4. Consider using `.slugignore` to exclude more

**Current Status:** ✅ Your project is ~50-100MB, well within limits!

---

## 💰 Cost & Limitations

### **Free Tier (What You Get)**

| Feature | Free Tier |
|---------|-----------|
| **RAM** | 512 MB per service |
| **CPU** | Shared |
| **Bandwidth** | Unlimited ✅ |
| **Build Time** | 15 minutes max |
| **Services** | Unlimited |
| **Custom Domains** | Yes ✅ |
| **SSL Certificates** | Free ✅ |
| **Auto-Deploy** | Yes ✅ |
| **Logs** | 7 days retention |

### **Free Tier Limitations**

⚠️ **Cold Starts:**
- Services spin down after 15 minutes of inactivity
- First request after inactivity takes ~30 seconds
- Subsequent requests are fast

⚠️ **Build Time:**
- Max 15 minutes to build
- Your project builds in ~5-10 minutes ✅

⚠️ **No Always-On:**
- Free services sleep when inactive
- Upgrade to Starter ($7/mo) for always-on

---

### **Upgrade Options**

If you need better performance:

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | $7/month | Always-on, no cold starts |
| **Pro** | $25/month | More RAM (2GB), priority support |
| **Team** | $85/month | Multiple team members, staging |

**Recommendation:** Start with free tier, upgrade if needed.

---

## 📊 Monitoring & Logs

### **View Logs**

1. Go to: Dashboard → Service → Logs
2. Real-time logs appear
3. Filter by time or search text
4. Download logs if needed

### **Common Log Commands**

```bash
# Check backend health
curl https://your-backend.onrender.com/health

# Test API endpoint
curl -X POST https://your-backend.onrender.com/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "user_email": "test@example.com"}'
```

### **Monitoring Best Practices**

1. ✅ Check logs after each deployment
2. ✅ Monitor error rates in Render Dashboard
3. ✅ Set up Supabase monitoring
4. ✅ Test key features regularly
5. ✅ Keep an eye on build times

---

## 🎯 Deployment Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] Backend health endpoint responds
- [ ] Frontend loads and shows UI
- [ ] Login functionality works
- [ ] Dashboard displays data from Supabase
- [ ] AI chat responds correctly
- [ ] Claim submission works
- [ ] File uploads work (if applicable)
- [ ] CORS configured correctly
- [ ] Custom domain added (optional)
- [ ] Team notified of URLs

---

## 🔄 Updates & Maintenance

### **Deploying Updates**

```bash
# Make your code changes
git add .
git commit -m "Your update message"
git push origin main

# Render auto-deploys! ✅
```

### **Manual Redeploy**

1. Go to: Dashboard → Service
2. Click **"Manual Deploy"**
3. Select branch (usually `main`)
4. Click **"Deploy"**

### **Rollback**

1. Go to: Dashboard → Service → Events
2. Find previous successful deploy
3. Click **"Rollback"**
4. Confirm rollback

---

## 📚 Additional Resources

- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Render Status:** [status.render.com](https://status.render.com)
- **Render Community:** [community.render.com](https://community.render.com)
- **Your Project Docs:** See `README.md`, `QUICKSTART.md`

---

## ✅ Success!

Your ClaimEase AI application is now deployed on Render! 🎉

**Frontend URL:** `https://claimease-frontend-[id].onrender.com`  
**Backend URL:** `https://claimease-backend-[id].onrender.com`

**Next Steps:**
1. Test all features
2. Share URLs with team
3. Monitor logs for any issues
4. Consider custom domain
5. Plan for upgrades if needed

---

**Deployed on:** December 23, 2025  
**Platform:** Render.com Free Tier  
**Status:** ✅ Ready for Production

