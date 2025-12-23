# ☁️ Google Cloud Run Deployment Guide

**Date:** December 23, 2025  
**Platform:** Google Cloud Run (UI-Based Setup)  
**Strategy:** Frontend (Vercel) + Backend (Cloud Run)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Preparation](#phase-1-preparation-5-mins)
3. [Phase 2: Cloud Run Setup](#phase-2-cloud-run-setup-15-mins)
4. [Phase 3: Connect Frontend](#phase-3-connect-frontend-5-mins)
5. [Phase 4: Testing](#phase-4-testing-5-mins)
6. [Troubleshooting](#troubleshooting)
7. [Cost Estimate](#cost-estimate)

---

## Prerequisites

### ✅ What You Need:

- [x] Google Cloud Platform account
- [x] GCP project created
- [x] GitHub repository access
- [x] Vercel account (for frontend)
- [x] Environment variables ready:
  - `OPENAI_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 📦 Files Ready:

- [x] `Dockerfile` (created)
- [x] `.dockerignore` (created)
- [x] All code pushed to GitHub

---

## Phase 1: Preparation (5 mins)

### Step 1: Verify Files Exist

Check these files are in your repository:

```bash
✅ Dockerfile
✅ .dockerignore
✅ src/api.py
✅ config/requirements.txt
✅ knowledge_base/
```

### Step 2: Commit and Push

```bash
git add Dockerfile .dockerignore
git commit -m "Add Cloud Run deployment configuration"
git push origin main
```

### Step 3: Gather Environment Variables

Copy these values (you'll need them):

| Variable | Where to Find | Example |
|----------|--------------|---------|
| `OPENAI_API_KEY` | OpenAI Dashboard | `sk-proj-...` |
| `SUPABASE_URL` | Supabase Project Settings | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings → API | `eyJhbG...` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings → API | `eyJhbG...` |
| `GEMINI_API_KEY` | Google AI Studio | `AIza...` |
| `FRONTEND_URL` | Vercel Deployment | `https://claimease.vercel.app` |

---

## Phase 2: Cloud Run Setup (15 mins)

### Step 1: Open Cloud Run Console

1. Go to: **https://console.cloud.google.com/run**
2. Select your GCP project (top bar)
3. Click **"CREATE SERVICE"** (big blue button)

---

### Step 2: Configure Source Repository

#### A. Select Deployment Method:
- Choose: **"Continuously deploy from a repository"**
- Click **"SET UP WITH CLOUD BUILD"**

#### B. Connect GitHub Repository:
1. Click **"Connect Repository"**
2. Provider: **GitHub**
3. Click **"Authenticate"**
4. Authorize Google Cloud Build
5. Select repository: **`aidill-deriv/claimease_ai`**
6. Branch: **`main`** ✅
7. Click **"NEXT"**

#### C. Configure Build:
- Build type: **Dockerfile** ✅
- Dockerfile path: **`/Dockerfile`** (default)
- Build context directory: **`/`** (default)
- Click **"SAVE"**

---

### Step 3: Configure Service Settings

#### Service Name:
```
claimease-backend
```

#### Region:
```
asia-southeast1 (Singapore)
```
*Closest to Malaysia for low latency*

#### Authentication:
- Select: **"Allow unauthenticated invocations"** ✅
- This allows your frontend to call the API

---

### Step 4: Configure Container

Click **"CONTAINER(S), VOLUMES, NETWORKING, SECURITY"**

#### Resources Tab:

| Setting | Value | Why |
|---------|-------|-----|
| **Memory** | `2 GiB` | For HuggingFace embeddings |
| **CPU** | `2` | Better performance |
| **Request timeout** | `300` seconds | 5 minutes for long AI queries |
| **Maximum requests per container** | `80` | Default is fine |

#### Autoscaling Tab:

| Setting | Value | Why |
|---------|-------|-----|
| **Minimum instances** | `0` | Free tier (scales to zero) |
| **Maximum instances** | `10` | Handle traffic spikes |

#### Container Port:
```
8080
```
*Must match PORT in Dockerfile*

---

### Step 5: Add Environment Variables

Click **"VARIABLES & SECRETS"** tab

Click **"+ ADD VARIABLE"** for each:

#### Required Variables:

| Name | Value | Notes |
|------|-------|-------|
| `OPENAI_API_KEY` | `sk-proj-...` | From OpenAI |
| `SUPABASE_URL` | `https://xxx.supabase.co` | From Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | From Supabase (secret!) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | From Supabase |
| `FRONTEND_URL` | `https://claimease.vercel.app` | Your Vercel URL |
| `KNOWLEDGE_BASE_SOURCE` | `supabase` | Use Supabase KB |
| `KNOWLEDGE_BASE_EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | HuggingFace model |

#### Optional Variables:

| Name | Value | Default |
|------|-------|---------|
| `MODEL_NAME` | `gpt-4o-mini` | OpenAI model |
| `GEMINI_API_KEY` | `AIza...` | If backend needs it |
| `LOG_LEVEL` | `info` | Logging level |

---

### Step 6: Deploy!

1. Review all settings
2. Click **"CREATE"** at the bottom
3. Wait 5-10 minutes for first build

#### What Happens:
```
☁️  Cloud Build starts
📦 Installs dependencies (pip install)
🔨 Builds Docker image
📤 Pushes to Container Registry
🚀 Deploys to Cloud Run
✅ Service live!
```

---

### Step 7: Get Service URL

After deployment:
1. Click your service name: **`claimease-backend`**
2. Copy the URL (top of page):
   ```
   https://claimease-backend-xxxxx-as.a.run.app
   ```
3. **Save this URL** - you'll need it for Vercel!

---

## Phase 3: Connect Frontend (5 mins)

### Step 1: Update Vercel Environment Variables

1. Go to: **https://vercel.com/dashboard**
2. Select your project: **`claimease_ai`**
3. Go to: **Settings → Environment Variables**

### Step 2: Update Backend URL

Find `NEXT_PUBLIC_API_URL` and update:

**Old value:**
```
https://claimease-backend.onrender.com
```

**New value:**
```
https://claimease-backend-xxxxx-as.a.run.app
```
*(Use your actual Cloud Run URL)*

### Step 3: Redeploy Frontend

1. Click **"Deployments"** tab
2. Click **"Redeploy"** on latest deployment
3. Wait 2-3 minutes

---

### Step 4: Update Backend CORS

Go back to Cloud Run:

1. Click **"EDIT & DEPLOY NEW REVISION"**
2. Go to **"VARIABLES & SECRETS"**
3. Update `FRONTEND_URL` with your Vercel URL:
   ```
   https://claimease-xxxxx.vercel.app
   ```
4. Click **"DEPLOY"**
5. Wait for new revision to deploy

---

## Phase 4: Testing (5 mins)

### Test Backend Health

```bash
# Replace with your Cloud Run URL
curl https://claimease-backend-xxxxx-as.a.run.app/health
```

**Expected response:**
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

### Test Backend Query

```bash
curl -X POST https://claimease-backend-xxxxx-as.a.run.app/query \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "test@example.com",
    "query_text": "What is my claim balance?"
  }'
```

**Expected:** AI response with claim info

---

### Test Frontend

1. Go to your Vercel URL: `https://claimease-xxxxx.vercel.app`
2. **Login** with Supabase auth
3. **Test chatbot:**
   - Ask: "What is my claim balance?"
   - Should get AI response ✅
4. **Test submit claim:**
   - Upload a receipt
   - OCR should extract data ✅
5. **Test dashboard:**
   - Should load claims from Supabase ✅

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Backend health check returns 200 OK
- [ ] Backend query endpoint works
- [ ] Frontend loads without errors
- [ ] Login/authentication works
- [ ] AI chatbot responds
- [ ] Dashboard shows data
- [ ] Submit claim works
- [ ] Receipt OCR works (Gemini)
- [ ] No CORS errors in browser console

---

## 🐛 Troubleshooting

### Issue 1: Build Fails - "No space left on device"

**Solution:** Reduce Docker image size
```dockerfile
# In Dockerfile, add:
RUN apt-get clean && rm -rf /var/lib/apt/lists/*
```

---

### Issue 2: Container Crashes - Out of Memory

**Symptoms:** 
```
Container terminated: Memory limit exceeded
```

**Solution:** Increase memory in Cloud Run:
1. Edit service
2. Resources → Memory: `4 GiB`
3. Deploy new revision

---

### Issue 3: Timeout During Startup

**Symptoms:**
```
Container failed to start. Failed to start and then listen on the port defined by the PORT environment variable.
```

**Solution:** Increase startup timeout:
1. Edit service
2. Container → Request timeout: `600` seconds
3. Deploy new revision

---

### Issue 4: "Connection refused" from Frontend

**Cause:** Wrong `NEXT_PUBLIC_API_URL` in Vercel

**Solution:**
1. Check Cloud Run URL is correct
2. Update Vercel env var
3. Redeploy frontend

---

### Issue 5: CORS Error

**Symptoms:**
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Solution:**
1. Go to Cloud Run service
2. Edit service
3. Update `FRONTEND_URL` to match Vercel URL
4. Deploy new revision

---

### Issue 6: HuggingFace Model Download Timeout

**Symptoms:**
```
Failed to download sentence-transformers model
```

**Solution:** Pre-cache model in Dockerfile:
```dockerfile
# Add before CMD
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

---

## 💰 Cost Estimate

### Free Tier Limits:
- **2 million requests/month**
- **360,000 GB-seconds memory/month**
- **180,000 vCPU-seconds/month**
- **1 GB network egress/month**

### Your Usage (~100 users, 50K requests/month):

| Resource | Usage | Cost |
|----------|-------|------|
| Requests | 50,000/month | Free ✅ |
| Memory (2GB × 10 hours) | 72,000 GB-sec | Free ✅ |
| CPU (2 × 10 hours) | 72,000 vCPU-sec | Free ✅ |
| Network egress | ~500 MB | Free ✅ |

**Estimated monthly cost: $0.00** 🎉

### If Exceeding Free Tier:
- Additional requests: **$0.40 per million**
- Additional memory: **$0.0000025 per GB-second**
- Additional CPU: **$0.00001 per vCPU-second**

**Example:** 5M requests, 20 hours/day uptime = **~$5-10/month**

---

## 🚀 Benefits vs Render

| Feature | Render Free | Cloud Run |
|---------|-------------|-----------|
| Memory | 512 MB ❌ | 2-4 GB ✅ |
| CPU | 0.5 vCPU | 2 vCPU ✅ |
| Timeout | 5 min | 60 min ✅ |
| Cold starts | Slow (~30s) | Fast (~3s) ✅ |
| Free tier | Always on, 512MB | 2M req/month ✅ |
| Logging | Basic | Cloud Logging ✅ |
| Monitoring | Basic | Cloud Monitoring ✅ |
| Scaling | Manual | Auto 0-1000 ✅ |

---

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Setup](https://cloud.google.com/build/docs/automating-builds/github/connect-repo-github)
- [Container Troubleshooting](https://cloud.google.com/run/docs/troubleshooting)
- [Cost Calculator](https://cloud.google.com/products/calculator)

---

## 🎯 Next Steps

After successful deployment:

1. **Monitor in Cloud Console:**
   - Check logs for errors
   - Monitor request latency
   - Check resource usage

2. **Set up alerts:**
   - Error rate > 5%
   - Memory usage > 80%
   - Request latency > 5s

3. **Optimize:**
   - Add Redis for caching (if needed)
   - Implement request throttling
   - Add custom domain

4. **Scale:**
   - Increase max instances for more traffic
   - Add Cloud CDN for static assets
   - Use Cloud SQL for heavy DB queries

---

**Deployment Date:** _____________  
**Service URL:** `https://claimease-backend-_____-as.a.run.app`  
**Status:** ⬜ In Progress  ⬜ Deployed  ⬜ Production

---

✅ **Ready to deploy!** Follow the steps above and you'll have a production-ready backend on Cloud Run in ~20 minutes!

