# ☁️ Cloud Run Quick Start Checklist

**5-Minute Overview** - Full guide: `CLOUD_RUN_DEPLOYMENT_GUIDE.md`

---

## ✅ Pre-Deployment Checklist

- [ ] Files committed and pushed to GitHub:
  - [ ] `Dockerfile`
  - [ ] `.dockerignore`
  - [ ] All source code

- [ ] Environment variables ready:
  - [ ] `OPENAI_API_KEY`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `FRONTEND_URL` (Vercel URL)

- [ ] GCP account setup:
  - [ ] Project created
  - [ ] Billing enabled (for free tier)
  - [ ] Cloud Run API enabled
  - [ ] Cloud Build API enabled

---

## 🚀 Deployment Steps (UI)

### 1. Create Service
- [ ] Go to: https://console.cloud.google.com/run
- [ ] Click **"CREATE SERVICE"**

### 2. Connect Repository
- [ ] Choose: **"Continuously deploy from repository"**
- [ ] Connect to GitHub: `aidill-deriv/claimease_ai`
- [ ] Branch: `main`
- [ ] Build type: **Dockerfile**

### 3. Configure Service
- [ ] Name: `claimease-backend`
- [ ] Region: `asia-southeast1`
- [ ] Auth: **Allow unauthenticated** ✅

### 4. Set Resources
- [ ] Memory: **2 GiB**
- [ ] CPU: **2**
- [ ] Timeout: **300 seconds**
- [ ] Min instances: **0**
- [ ] Max instances: **10**
- [ ] Port: **8080**

### 5. Add Environment Variables
```
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
FRONTEND_URL=https://your-app.vercel.app
KNOWLEDGE_BASE_SOURCE=supabase
KNOWLEDGE_BASE_EMBEDDING_MODEL=all-MiniLM-L6-v2
```

### 6. Deploy
- [ ] Click **"CREATE"**
- [ ] Wait 5-10 minutes
- [ ] Copy service URL

### 7. Update Vercel
- [ ] Update `NEXT_PUBLIC_API_URL` in Vercel
- [ ] Redeploy frontend

### 8. Test
- [ ] Backend: `curl https://your-service.run.app/health`
- [ ] Frontend: Login and test chatbot

---

## 📋 Quick Commands

### Test Backend Health
```bash
curl https://claimease-backend-xxxxx-as.a.run.app/health
```

### Test Backend Query
```bash
curl -X POST https://claimease-backend-xxxxx-as.a.run.app/query \
  -H "Content-Type: application/json" \
  -d '{"user_email":"test@example.com","query_text":"What is my balance?"}'
```

### View Logs
```bash
gcloud run services logs read claimease-backend --region=asia-southeast1
```

---

## 🐛 Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Build fails | Check Dockerfile syntax |
| Out of memory | Increase to 4 GiB |
| Timeout | Increase request timeout to 600s |
| CORS error | Check `FRONTEND_URL` matches Vercel |
| 404 on frontend | Update `NEXT_PUBLIC_API_URL` |

---

## 💰 Cost

**Free tier:** 2M requests/month  
**Your usage:** ~50K requests/month  
**Cost:** **$0/month** ✅

---

## 🎯 Success = All Green

- ✅ Backend health check returns 200
- ✅ Frontend loads
- ✅ Login works
- ✅ Chatbot responds
- ✅ Dashboard shows data
- ✅ Submit claim works

---

**Total time:** ~20 minutes  
**Difficulty:** Easy (UI-based, no CLI needed)

Full guide: `CLOUD_RUN_DEPLOYMENT_GUIDE.md`

