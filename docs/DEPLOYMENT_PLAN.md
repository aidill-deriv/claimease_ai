## ClaimEase Deployment Plan

This guide covers two deployment tracks:

1. **UAT / Internal testing** – ship the Next.js frontend on **Vercel (Hobby)** while running the FastAPI backend on a managed host such as **Render Free Web Service**. This keeps costs at $0 and gives teammates a stable URL for testing.
2. **Production scale** – containerize the full stack and run it on **Google Cloud Run**, unlocking autoscaling, regional redundancy, and tighter IAM controls.

The same Supabase project is used in both environments; only the compute layer changes.

---

### 1. UAT Deployment (Vercel + Render)

**Architecture**

- FastAPI backend: Render Free Web Service (auto HTTPS, sleeps after 15 min idle).
- Next.js frontend: Vercel Hobby.
- Supabase: existing project (`ijvpawrmzyfcvwnsyrqe`).

**Step A – Deploy the FastAPI backend to Render**

1. Push the repository to GitHub (already done).
2. In Render, create a _Web Service_ and connect the repo.
3. Settings:
   - **Build Command:** `pip3 install -r config/requirements.txt`
   - **Start Command:** `python3 -m uvicorn src.api:app --host 0.0.0.0 --port 8001`
   - **Environment:** `Python 3.11` (or the version in `runtime.txt` if added).
4. Add environment variables (Render → Settings → Environment):

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | LLM access |
| `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` | server-side Supabase client (`getSupabaseServiceClient`) |
| `SUPABASE_ANON_KEY` | optional unless backend proxies |
| `CLAIMEASE_SESSION_SECRET` | must match the frontend |
| `ENABLE_RECEIPT_OCR`, `GEMINI_API_KEY`, `GEMINI_RECEIPT_MODEL` | OCR |
| `KNOWLEDGE_BASE_SOURCE`, `DISABLE_KNOWLEDGE_BASE` | Supabase vector toggle |
| Slack keys (optional) | leave unset if Slack is disabled |

5. After deploy, note the Render URL (e.g., `https://claimease-api.onrender.com`). The API surface is identical (`/query`, `/feedback`, `/submit-claim`, etc.).

**Step B – Deploy the Next.js frontend to Vercel**

1. Create a new Vercel project, import the repo, and choose the `main` branch.
2. Set environment variables (Vercel → Project → Settings → Environment Variables) for **Production** and **Preview**:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://claimease-api.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE`, `NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE`, etc. | Table names |
| `NEXT_PUBLIC_ENABLE_RECEIPT_OCR` | `true`/`false` |
| `SUPABASE_SERVICE_ROLE_KEY` | only if server components need it (Vercel keeps it server-side) |
| `CLAIMEASE_SESSION_SECRET` | must match backend |
| Any feature flags (knowledge base source, OCR models, benefit restrictions) |

3. Deploy. Vercel gives you a URL like `https://claimease-uat.vercel.app`.
4. Verify:
   - Visit the Vercel URL → login.
   - Submit a claim → confirm API calls hit Render via `/api`.
   - Chatbot answers using Supabase KB.

**Notes**

- Render’s free tier sleeps; first request may take ~30s. For demos, wake it up beforehand.
- If you prefer Fly.io/Railway for the backend, the env vars and start command are the same.
- You can keep Cloudflare tunnels as a fallback for purely local backend testing.

---

### 2. Production Deployment (Google Cloud Run)

**Why Cloud Run?**

- Autoscaling from zero to N instances.
- Managed HTTPS and custom domains.
- Tight IAM (limit who can invoke, add Cloud Armor).
- Integrates with Artifact Registry, Secret Manager, Cloud Logging.

**Step A – Create a production Docker image**

`Dockerfile` (multi-stage example):

```dockerfile
FROM node:20-slim AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM python:3.11-slim AS backend
WORKDIR /app
COPY --from=frontend-build /app /app
RUN pip3 install --no-cache-dir -r config/requirements.txt
ENV PORT=8001
CMD ["sh", "-c", "node_modules/.bin/next start --hostname 0.0.0.0 --port 3000 & python3 -m uvicorn src.api:app --host 0.0.0.0 --port 8001"]
```

Alternative: run FastAPI behind `gunicorn` + `uvicorn.workers.UvicornWorker`, and serve Next.js via `next start` or static export behind Nginx. Adjust to your preferred process manager (e.g., `supervisord`).

**Step B – Build & push to Artifact Registry**

```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
gcloud builds submit --tag gcr.io/<PROJECT_ID>/claimease-fullstack
```

**Step C – Deploy to Cloud Run**

```bash
gcloud run deploy claimease \
  --image gcr.io/<PROJECT_ID>/claimease-fullstack \
  --region asia-southeast1 \
  --port 3000 \
  --allow-unauthenticated
```

- Set env vars via `--set-env-vars` or the console. Mirror the table from the UAT section (include Supabase keys, OCR flags, knowledge base settings, `CLAIMEASE_SESSION_SECRET`).
- If you split frontend/backend:
  - Deploy FastAPI (`PORT=8001`) as `claimease-api`.
  - Deploy Next.js (`next start`) as `claimease-web`.
  - Set `NEXT_PUBLIC_API_URL` in the web service to the API service URL (e.g., `https://claimease-api-<hash>-a.run.app`).

**Optional enhancements**

- **Custom domain:** map `claims.example.com` to Cloud Run via Cloud DNS + HTTPS certificate.
- **Secret Manager:** store sensitive vars (`SUPABASE_SERVICE_ROLE_KEY`, OCR keys) and mount them as env vars (`--set-secrets`).
- **VPC connector:** if the backend needs private resources.
- **Autoscaling controls:** `--min-instances`, `--max-instances`, `--concurrency`.

**Observability**

- Cloud Logging automatically captures stdout/stderr.
- Use Cloud Monitoring dashboards for request latency and error rate.
- Set up alerts on 5xx rate or latency spikes.

**Zero-downtime rollout**

- Use revisions: `gcloud run services update-traffic claimease --to-latest`.
- Roll back via `gcloud run services update-traffic claimease --to-revisions <old>=100`.

---

### 3. Switching Between UAT and Production

- **Frontend toggle:** Set `NEXT_PUBLIC_API_URL` to the appropriate backend URL (Render vs Cloud Run). For local fallback, keep the `/api` proxy in `next.config.js`.
- **Session secret:** Keep `CLAIMEASE_SESSION_SECRET` consistent per environment (UAT vs PROD) so login cookies remain valid.
- **Feature flags:** Use `.env` parity to decide which knowledge base or OCR model is active. `config/.env` (backend) and `.env.local` (frontend) should have matching values before each deploy.
- **Rollback plan:** Maintain tagged releases (`v1.0-uat`, `v1.0-prod`). If Cloud Run deploy misbehaves, direct traffic back to Vercel UAT while you fix the container.

This two-stage approach lets you iterate quickly on Vercel, demo to stakeholders, and then promote stable builds to Cloud Run when you need scale and tighter controls.

