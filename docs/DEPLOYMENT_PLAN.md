## Deployment Plan (UAT → Production)

ClaimEase uses the same Supabase backend for both environments. We promote code through two compute tiers:

1. **UAT / Internal Demos** – Next.js UI on **Vercel (Hobby)** + FastAPI backend on a lightweight host (Render Free Web Service). Zero cost, easy sharing, OK with sleeping services.
2. **Production Scale** – Containerised stack on **Google Cloud Run**. Autoscaling, IAM controls, custom domains, and tighter observability.

---

### 1. UAT Deployment (Vercel + Render)

**Architecture**

- FastAPI backend → Render Free Web Service (or Fly/Railway equivalent). Provides HTTPS and simple env-var UI.
- Next.js frontend → Vercel Hobby project.
- Supabase remains unchanged; both layers consume the same project keys/tables.

**1A. Backend on Render**

1. Push latest `main` to GitHub.
2. In Render:
   - “New + Web Service” → connect the repo.
   - Set **Build Command** `pip3 install -r config/requirements.txt`.
   - Set **Start Command** `python3 -m uvicorn src.api:app --host 0.0.0.0 --port 8001`.
   - Choose Python 3.11 and Free tier.
3. Add environment variables (Render → Settings → Environment):

| Variable | Notes |
| --- | --- |
| `OPENAI_API_KEY` | Required for chat + OCR reasoning |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Used by FastAPI for knowledge base + dashboard queries |
| `SUPABASE_ANON_KEY` | Optional (only if backend proxies anon calls) |
| `CLAIMEASE_SESSION_SECRET` | Must match frontend |
| `KNOWLEDGE_BASE_SOURCE`, `DISABLE_KNOWLEDGE_BASE`, `KNOWLEDGE_BASE_COUNTRY` | Feature flags |
| `ENABLE_RECEIPT_OCR`, `GEMINI_API_KEY`, `GEMINI_RECEIPT_MODEL` | OCR support |
| Slack keys (optional) | Omit if Slack is disabled |

4. Deploy and grab the Render URL (e.g., `https://claimease-api.onrender.com`). Keep it handy for the frontend.

**1B. Frontend on Vercel**

1. Create a new Vercel project → import the repo.
2. Configure Env Vars (Production and Preview):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Render backend URL (`https://claimease-api.onrender.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Only if server components need it (Vercel keeps it server-side) |
| `CLAIMEASE_SESSION_SECRET` | Same as backend |
| `NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE`, `NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE`, etc. | Table names |
| `NEXT_PUBLIC_ENABLE_RECEIPT_OCR`, `ENABLE_RECEIPT_OCR`, OCR model flags | Optional |
| Knowledge-base flags | `DISABLE_KNOWLEDGE_BASE`, `KNOWLEDGE_BASE_SOURCE=supabase` |

3. Deploy. Vercel provides a URL like `https://claimease-uat.vercel.app`.
4. Verification checklist:
   - Visit Vercel URL, log in → ensure session stored & navigation works.
   - Submit a sample claim; attachments should post via `/api/submit-claim` -> Render backend.
   - Chatbot loads knowledge base answers via Supabase and Render `/query`.

> **Tip:** Render’s free tier sleeps after ~15 mins. Wake it up before demos by hitting `/health`.

---

### 2. Production Deployment (Google Cloud Run)

**Why Cloud Run?**

- Scales from 0 to N containers automatically.
- Managed HTTPS + custom domains via Cloud Run + Cloud DNS.
- IAM-controlled invokers, Secret Manager integration, Cloud Logging/Monitoring.

**2A. Create a Docker image**

Example `Dockerfile` (two-stage):

```dockerfile
FROM node:20-slim AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY --from=frontend /app /app
RUN pip3 install --no-cache-dir -r config/requirements.txt
ENV PORT=3000 BACKEND_PORT=8001
CMD ["sh", "-c", "node_modules/.bin/next start --hostname 0.0.0.0 --port $PORT & python3 -m uvicorn src.api:app --host 0.0.0.0 --port $BACKEND_PORT"]
```

Options:
- Use `supervisord` or `pm2` if you prefer explicit process management.
- Split services: one image for FastAPI (Cloud Run service #1) and one for Next.js (service #2). In that case, set `NEXT_PUBLIC_API_URL` on the frontend service to point at the backend service URL.

**2B. Build & push to Artifact Registry**

```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
gcloud builds submit --tag gcr.io/<PROJECT_ID>/claimease
```

**2C. Deploy to Cloud Run**

```bash
gcloud run deploy claimease \
  --image gcr.io/<PROJECT_ID>/claimease \
  --region asia-southeast1 \
  --port 3000 \
  --allow-unauthenticated
```

If you split services:

- Deploy `claimease-api` with `--port 8001`.
- Deploy `claimease-web` with `--port 3000` and set `NEXT_PUBLIC_API_URL=https://claimease-api-xxxx.a.run.app`.

**2D. Configure env vars/secrets**

- Use `--set-env-vars` or Cloud Run console to add the same variables listed under UAT.
- For sensitive data, prefer **Secret Manager**:
  ```bash
  gcloud secrets create claimease-service-role-key --data-file=-
  gcloud run services update claimease \
    --set-secrets SUPABASE_SERVICE_ROLE_KEY=claimease-service-role-key:1
  ```

**2E. Enhancements**

- **Custom domain:** map `claims.company.com` via Cloud Run domain mapping + Cloud DNS; SSL certs issued automatically.
- **Autoscaling controls:** e.g., `--min-instances 1 --max-instances 10 --concurrency 80`.
- **Logging/Monitoring:** Cloud Run pipes stdout/stderr to Cloud Logging. Create alerting policies for high error rates or latency.
- **Traffic splitting:** deploy new revisions and shift traffic gradually (`gcloud run services update-traffic`).

---

### 3. Promoting from UAT to Production

| Step | UAT (Vercel + Render) | Production (Cloud Run) |
| --- | --- | --- |
| Source branch | `main` or feature branch | Tagged release (e.g., `v1.2`) |
| Env vars | Vercel + Render dashboards | Cloud Run env vars / Secret Manager |
| API URL | `https://claimease-api.onrender.com` | `https://claimease-<hash>-a.run.app` (or custom domain) |
| Session secret | Same value across frontend + backend for each environment | Same |
| Testing | Manual regression, UAT scripts | Load/perf test, canary traffic split |
| Rollback | Revert Vercel deployment or disable feature in `.env` | Shift Cloud Run traffic back to previous revision |

**Checklist when promoting:**
1. Merge approved changes to `main`.
2. Confirm UAT build is green (Vercel + Render). Run quick smoke tests.
3. Tag release (`git tag v1.2 && git push --tags`).
4. Build Cloud Run image from the tag and deploy.
5. Add/verify env vars on Cloud Run; ensure Supabase table names and knowledge base flags match production expectations.
6. Point `NEXT_PUBLIC_API_URL` to the Cloud Run backend; redeploy the Cloud Run web service (or Vercel if you keep Vercel for prod).
7. Update documentation / release notes.

---

### 4. FAQs

- **Can we keep everything on Vercel?** You could deploy the backend as a Vercel serverless function, but long-running OCR/AI calls may exceed the edge function limits. Render/Fly provide longer timeouts during UAT.
- **Do we need Docker for UAT?** No. Only the Cloud Run path requires a container.
- **Can we reuse the Render backend for production?** Not recommended—free tiers sleep and aren’t SLA-backed. Cloud Run (or a paid Render plan) is better for production SLAs.
- **How do we switch back to local?** Set `NEXT_PUBLIC_API_URL=http://localhost:8001` and run `npm run backend` + `npm run dev`. Environment files already support toggling the knowledge base source (`KNOWLEDGE_BASE_SOURCE=local`).

This two-tier plan keeps UAT lightweight for rapid iteration while giving us a path to a hardened production deployment on Cloud Run once features are stable.

