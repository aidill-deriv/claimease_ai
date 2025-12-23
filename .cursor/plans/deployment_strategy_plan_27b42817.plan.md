---
name: Deployment Strategy Plan
overview: Create a comprehensive deployment strategy for ClaimEase AI covering both UAT/staging and production environments, with moderate budget and Docker-based infrastructure.
todos:
  - id: create-dockerfiles
    content: Create Dockerfile for Railway UAT backend, Dockerfile.backend and Dockerfile.frontend for Cloud Run production
    status: pending
  - id: update-next-config
    content: "Update next.config.js to add 'output: standalone' for Docker builds"
    status: pending
  - id: create-dockerignore
    content: Create .dockerignore file to exclude unnecessary files from Docker builds
    status: pending
  - id: update-cors
    content: Update src/api.py CORS middleware to include production domains
    status: pending
  - id: setup-uat-vercel
    content: "Deploy frontend to Vercel: connect GitHub repo, configure build settings, set environment variables"
    status: pending
  - id: setup-uat-railway
    content: "Deploy backend to Railway: connect GitHub repo, configure Dockerfile, set environment variables"
    status: pending
  - id: test-uat
    content: "Test UAT deployment: verify login, chat, claim submission, dashboard functionality"
    status: pending
  - id: setup-gcp-project
    content: Create GCP project, enable required APIs (Cloud Run, Cloud Build, Secret Manager)
    status: pending
  - id: build-cloud-run-images
    content: Build and push Docker images to Google Container Registry/Artifact Registry
    status: pending
  - id: deploy-cloud-run-backend
    content: Deploy backend service to Cloud Run with proper memory/CPU settings and secrets
    status: pending
  - id: deploy-cloud-run-frontend
    content: Deploy frontend service to Cloud Run with environment variables pointing to backend
    status: pending
  - id: setup-secrets
    content: Store sensitive credentials in Google Secret Manager and attach to Cloud Run services
    status: pending
  - id: configure-domain
    content: Set up custom domain mapping in Cloud Run and configure DNS records
    status: pending
  - id: setup-monitoring
    content: Configure Cloud Logging, set up alerting policies for errors and latency
    status: pending
  - id: create-cicd
    content: Create GitHub Actions workflow for automated deployments on version tags
    status: pending
---

# ClaimEase AI Deployment Strategy

## Architecture Overview

ClaimEase consists of:

- **Next.js Frontend** (port 3000) - React app with API routes
- **FastAPI Backend** (port 8001) - Python API with LangChain agent
- **Supabase** - PostgreSQL database (already hosted)
- **ChromaDB** - Vector database (can use Supabase-based or local)
- **Slack Integration** - Optional webhook handler

## Deployment Strategy: Two-Tier Approach

### Tier 1: UAT/Staging Environment

**Purpose**: Testing, demos, internal use**Budget**: ~$0-25/month (free tiers + minimal paid)**Platforms**: Vercel (frontend) + Railway/Render (backend)

### Tier 2: Production Environment  

**Purpose**: Live production use, high availability**Budget**: ~$50-100/month (always-on, auto-scaling)**Platforms**: Google Cloud Run or Railway Pro (both services)---

## Phase 1: UAT Deployment

### 1.1 Frontend on Vercel

**Why Vercel**:

- Zero-config Next.js deployment
- Free tier: 100GB bandwidth/month
- Automatic HTTPS, CDN, preview deployments
- Easy environment variable management

**Steps**:

1. Push code to GitHub repository
2. Connect GitHub repo to Vercel (vercel.com → New Project)
3. Configure build settings:

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Framework Preset: Next.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Root Directory: `/` (root)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Build Command: `npm run build`
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Output Directory: `.next`

4. Set environment variables in Vercel dashboard:
   ```javascript
            NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
            NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
            NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
            CLAIMEASE_SESSION_SECRET=<generate-random-secret>
            NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE=claim_summary
            NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE=claim_analysis
            NEXT_PUBLIC_SUPABASE_EMPLOYEE_TABLE=employee_email
   ```




5. Deploy - Vercel auto-deploys on git push

**Cost**: Free tier sufficient for UAT

### 1.2 Backend on Railway

**Why Railway**:

- Simple Docker deployment
- Free tier: $5 credit/month (covers UAT)
- Automatic HTTPS, zero-downtime deploys
- Built-in PostgreSQL support (not needed, but good for future)

**Steps**:

1. Create `Dockerfile` in project root:
   ```dockerfile
            FROM python:3.11-slim
            
            WORKDIR /app
            
            # Install system dependencies
            RUN apt-get update && apt-get install -y \
                gcc \
                && rm -rf /var/lib/apt/lists/*
            
            # Copy requirements and install Python dependencies
            COPY config/requirements.txt config/requirements_ai.txt config/requirements_kb.txt ./
            RUN pip install --no-cache-dir -r requirements.txt && \
                pip install --no-cache-dir -r requirements_ai.txt && \
                pip install --no-cache-dir -r requirements_kb.txt
            
            # Copy application code
            COPY src/ ./src/
            COPY knowledge_base/ ./knowledge_base/
            COPY config/ ./config/
            
            # Set environment
            ENV PYTHONPATH=/app
            ENV PORT=8001
            
            # Expose port
            EXPOSE 8001
            
            # Health check
            HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
              CMD python -c "import requests; requests.get('http://localhost:8001/health')"
            
            # Run FastAPI
            CMD ["python3", "-m", "uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8001"]
   ```




2. Create `.dockerignore`:
   ```javascript
            node_modules
            .next
            .git
            chroma_db
            logs
            __pycache__
            *.pyc
            .env
            .env.local
            venv
   ```




3. Deploy to Railway:

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Sign up at railway.app
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - New Project → Deploy from GitHub repo
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Railway auto-detects Dockerfile
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Set environment variables:
     ```javascript
                    OPENAI_API_KEY=<your-key>
                    SUPABASE_URL=<your-url>
                    SUPABASE_SERVICE_ROLE_KEY=<service-key>
                    SUPABASE_ANON_KEY=<anon-key>
                    CLAIMEASE_SESSION_SECRET=<same-as-frontend>
                    KNOWLEDGE_BASE_SOURCE=supabase
                    DISABLE_KNOWLEDGE_BASE=0
                    GEMINI_API_KEY=<optional>
                    GEMINI_RECEIPT_MODEL=gemini-2.5-flash
                    PORT=8001
     ```




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Railway provides HTTPS URL automatically

4. Update Vercel `NEXT_PUBLIC_API_URL` to Railway backend URL

**Cost**: Free tier ($5 credit) covers UAT usage**Alternative**: Render.com (free tier sleeps after 15min inactivity)

### 1.3 Knowledge Base Configuration

**For UAT**: Use Supabase-based knowledge base (no local ChromaDB needed)

- Set `KNOWLEDGE_BASE_SOURCE=supabase` in backend env
- Ensure `claim_knowledge_chunks` table exists in Supabase
- No persistent volume needed

---

## Phase 2: Production Deployment

### Option A: Google Cloud Run (Recommended)

**Why Cloud Run**:

- Serverless containers (pay per request)
- Auto-scaling (0 to N instances)
- Built-in HTTPS, IAM, Secret Manager
- Cost: ~$0.40 per million requests + compute time
- Estimated: $30-60/month for moderate traffic

**Architecture**: Separate services for frontend and backend

#### 2A.1 Create Docker Images

**Backend Dockerfile** (`Dockerfile.backend`):

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

COPY config/requirements*.txt ./
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -r requirements_ai.txt && \
    pip install --no-cache-dir -r requirements_kb.txt

COPY src/ ./src/
COPY knowledge_base/ ./knowledge_base/
COPY config/ ./config/

ENV PYTHONPATH=/app
ENV PORT=8001

EXPOSE 8001

CMD ["python3", "-m", "uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Frontend Dockerfile** (`Dockerfile.frontend`):

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

**Update `next.config.js`** to enable standalone output:

```javascript
const nextConfig = {
  output: 'standalone', // Add this
  // ... existing config
}
```



#### 2A.2 Deploy Backend Service

```bash
# Set variables
PROJECT_ID=your-gcp-project-id
REGION=asia-southeast1  # or us-central1
BACKEND_SERVICE=claimease-api

# Authenticate
gcloud auth login
gcloud config set project $PROJECT_ID

# Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Build and push image
gcloud builds submit --tag gcr.io/$PROJECT_ID/claimease-backend

# Deploy backend
gcloud run deploy $BACKEND_SERVICE \
  --image gcr.io/$PROJECT_ID/claimease-backend \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8001 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "KNOWLEDGE_BASE_SOURCE=supabase,DISABLE_KNOWLEDGE_BASE=0"

# Store secrets in Secret Manager
echo -n "your-secret" | gcloud secrets create claimease-openai-key --data-file=-
gcloud secrets create claimease-supabase-url --data-file=<(echo -n "$SUPABASE_URL")
gcloud secrets create claimease-supabase-role-key --data-file=<(echo -n "$SUPABASE_SERVICE_ROLE_KEY")
gcloud secrets create claimease-session-secret --data-file=<(echo -n "$CLAIMEASE_SESSION_SECRET")

# Attach secrets to service
gcloud run services update $BACKEND_SERVICE \
  --set-secrets "OPENAI_API_KEY=claimease-openai-key:latest,SUPABASE_URL=claimease-supabase-url:latest,SUPABASE_SERVICE_ROLE_KEY=claimease-supabase-role-key:latest,CLAIMEASE_SESSION_SECRET=claimease-session-secret:latest"
```



#### 2A.3 Deploy Frontend Service

```bash
FRONTEND_SERVICE=claimease-web
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)')

# Build and push
gcloud builds submit --tag gcr.io/$PROJECT_ID/claimease-frontend

# Deploy frontend
gcloud run deploy $FRONTEND_SERVICE \
  --image gcr.io/$PROJECT_ID/claimease-frontend \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --min-instances 1 \
  --max-instances 5 \
  --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL,NEXT_PUBLIC_SUPABASE_URL=<url>,NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>"
```



#### 2A.4 Custom Domain Setup

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service $FRONTEND_SERVICE \
  --domain claims.yourdomain.com \
  --region $REGION

# Follow DNS instructions provided
```



### Option B: Railway Pro (Simpler Alternative)

**Why Railway Pro**:

- Simpler than Cloud Run
- $20/month per service (frontend + backend = $40/month)
- Built-in CI/CD, zero-downtime deploys
- Good for teams wanting less infrastructure management

**Steps**:

1. Upgrade Railway account to Pro ($20/month)
2. Deploy backend service (same Dockerfile as UAT)
3. Deploy frontend service (create separate Dockerfile for Next.js)
4. Set environment variables in Railway dashboard
5. Configure custom domain in Railway settings

**Frontend Dockerfile for Railway**:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Phase 3: Configuration & Optimization

### 3.1 Environment Variables Checklist

**Backend (Railway/Cloud Run)**:

- `OPENAI_API_KEY` - Required
- `SUPABASE_URL` - Required
- `SUPABASE_SERVICE_ROLE_KEY` - Required
- `SUPABASE_ANON_KEY` - Optional
- `CLAIMEASE_SESSION_SECRET` - Must match frontend
- `KNOWLEDGE_BASE_SOURCE=supabase` - Use Supabase KB
- `DISABLE_KNOWLEDGE_BASE=0` - Enable KB
- `GEMINI_API_KEY` - Optional (for OCR)
- `GEMINI_RECEIPT_MODEL=gemini-2.5-flash` - OCR model
- `PORT=8001` - Backend port

**Frontend (Vercel/Cloud Run)**:

- `NEXT_PUBLIC_API_URL` - Backend URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `CLAIMEASE_SESSION_SECRET` - Must match backend
- `NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE=claim_summary`
- `NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE=claim_analysis`
- `NEXT_PUBLIC_SUPABASE_EMPLOYEE_TABLE=employee_email`

### 3.2 CORS Configuration

Update `src/api.py` CORS middleware:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-uat-app.vercel.app",
        "https://claims.yourdomain.com",  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```



### 3.3 Monitoring & Logging

**Cloud Run**:

- Built-in Cloud Logging (automatic)
- Set up alerting policies for error rates
- Monitor request latency

**Railway**:

- Built-in logs dashboard
- Set up external monitoring (e.g., Better Uptime, UptimeRobot)

**Vercel**:

- Built-in analytics
- Error tracking (integrate Sentry)

### 3.4 Database Considerations

- **Supabase**: Already hosted, no deployment needed
- **ChromaDB**: Use Supabase-based knowledge base (`KNOWLEDGE_BASE_SOURCE=supabase`) - no local storage needed
- Ensure `claim_knowledge_chunks` table exists in Supabase

---

## Phase 4: CI/CD Setup

### 4.1 GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    tags:
                                                                                                                                                                                                                                                                                                                                    - 'v*'

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
                                                                                                                                                                                                                                                                                                                                    - uses: actions/checkout@v3
                                                                                                                                                                                                                                                                                                                                    - name: Setup GCP Auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
                                                                                                                                                                                                                                                                                                                                    - name: Build and Deploy
        run: |
          gcloud builds submit --tag gcr.io/$PROJECT_ID/claimease-backend
          gcloud run deploy claimease-api --image gcr.io/$PROJECT_ID/claimease-backend --region asia-southeast1
```



### 4.2 Vercel Auto-Deploy

- Vercel auto-deploys on push to main branch
- Preview deployments for PRs
- Production deployments for main branch

---

## Cost Estimation

### UAT Environment

- **Vercel**: Free (100GB bandwidth)
- **Railway**: Free tier ($5 credit/month)
- **Total**: $0/month

### Production Environment

**Option A: Google Cloud Run**

- Backend: ~$20-40/month (compute + requests)
- Frontend: ~$10-20/month (compute + requests)
- **Total**: ~$30-60/month

**Option B: Railway Pro**

- Backend: $20/month
- Frontend: $20/month
- **Total**: $40/month

---

## Migration Path: UAT → Production

1. **Test in UAT**: Deploy to Vercel + Railway, test thoroughly
2. **Tag Release**: `git tag v1.0.0 && git push --tags`
3. **Deploy Production**: Build Cloud Run images from tag
4. **Update DNS**: Point custom domain to production
5. **Monitor**: Watch logs, error rates, performance
6. **Rollback Plan**: Keep previous Cloud Run revision, can rollback via traffic splitting

---

## Files to Create/Modify

1. **Create `Dockerfile`** (for Railway UAT backend)
2. **Create `Dockerfile.backend`** (for Cloud Run backend)
3. **Create `Dockerfile.frontend`** (for Cloud Run frontend)
4. **Create `.dockerignore`**
5. **Update `next.config.js`** - Add `output: 'standalone'`
6. **Create `.github/workflows/deploy.yml`** (optional CI/CD)
7. **Update `src/api.py`** - Add production CORS origins

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables documented
- [ ] Dockerfiles tested locally
- [ ] `next.config.js` updated for standalone output
- [ ] CORS origins updated in backend
- [ ] Knowledge base configured (Supabase)
- [ ] Session secret generated and consistent

### UAT Deployment

- [ ] Backend deployed to Railway/Render
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set correctly
- [ ] Health check endpoint working (`/health`)
- [ ] Login flow tested
- [ ] Chat functionality tested
- [ ] Claim submission tested

### Production Deployment

- [ ] GCP project created and billing enabled
- [ ] Docker images built and pushed
- [ ] Backend service deployed to Cloud Run
- [ ] Frontend service deployed to Cloud Run
- [ ] Secrets stored in Secret Manager
- [ ] Custom domain configured
- [ ] SSL certificates verified
- [ ] Monitoring and alerting set up
- [ ] Load testing completed
- [ ] Rollback procedure documented

---

## Troubleshooting

### Backend Issues

- Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision"`
- Verify environment variables: `gcloud run services describe SERVICE_NAME`
- Test health endpoint: `curl https://backend-url/health`

### Frontend Issues

- Check Vercel deployment logs
- Verify `NEXT_PUBLIC_API_URL` points to correct backend
- Check browser console for CORS errors
- Verify environment variables in Vercel dashboard

### Database Issues

- Verify Supabase connection strings
- Check Supabase dashboard for connection limits
- Ensure knowledge base table exists

---

## Next Steps

1. **Start with UAT**: Deploy to Vercel + Railway (free tier)
2. **Test thoroughly**: Run through all user flows