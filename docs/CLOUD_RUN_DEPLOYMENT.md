# Cloud Run Deployment Guide

This document expands Section 2 of `docs/DEPLOYMENT_PLAN.md` with concrete commands and settings to run ClaimEase on Google Cloud Run.

---

## 0. Prerequisites

- Google Cloud project with billing enabled.
- `gcloud` CLI installed and authenticated (`gcloud auth login`).
- Artifact Registry or Container Registry API enabled (`gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com`).
- Supabase, OpenAI, and Gemini credentials ready (see `docs/ENVIRONMENT_CREDENTIALS.md`).

---

## 1. Build & Push the Container

### 1A. Using the Google Cloud Console (UI)
1. Open https://console.cloud.google.com/cloud-build/builds and make sure the correct project is selected.
2. Click **Run a build** → **Source**: select **Cloud Source Repository / GitHub** (wherever the repo lives). If the repo is local only, upload a ZIP using **Cloud Storage**.
3. Under **Build Configuration**, choose **Dockerfile** and leave the location as the repo root unless you use a subfolder.
4. Set the **Image** to `gcr.io/PROJECT_ID/claimease` (replace `PROJECT_ID`).
5. Click **Create**. Cloud Build will build the Docker image and push it to Container Registry automatically.

> Tip: You can watch the build logs in the UI. When it finishes with status **Success**, the image is ready for Cloud Run.

From the repo root:

```bash
PROJECT_ID=<your-project-id>
REGION=asia-southeast1
IMAGE=claimease

gcloud config set project $PROJECT_ID
gcloud builds submit --tag gcr.io/$PROJECT_ID/$IMAGE
```

This uses the project’s `Dockerfile` to build both the Next.js frontend and FastAPI backend and pushes the image to Container Registry.

_Optional:_ Use Artifact Registry instead:
```bash
gcloud artifacts repositories create claimease --repository-format=docker --location=$REGION
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/claimease/app
```

---

## 2. Deploy Backend Service

### 2A. Using the Google Cloud Console (UI)
1. Visit https://console.cloud.google.com/run and click **Create Service**.
2. Pick the same **Region** you used in the build step (e.g., `asia-southeast1`).
3. Under **Container image URL**, click **Select** → choose `gcr.io/PROJECT_ID/claimease` from Container Registry.
4. Expand **Container, Variables & Secrets**:
   - **Container port**: `8001`
   - **Memory**: at least `1 GiB`
   - **Environment variables**: add the key/value pairs listed in step 2B or attach Secret Manager entries (see section 4).
5. Under **Autoscaling**, keep defaults (`min instances 0`, `max instances 5`) or adjust if you want a warm instance.
6. Click **Create** and wait for deployment. When it finishes, note the service URL (`https://SERVICE-NAME-REGION.a.run.app`) and test it with `/health`.

Deploy FastAPI (port 8001) with at least 1 GiB memory to accommodate HuggingFace embeddings:

```bash
BACKEND_SERVICE=claimease-api
BACKEND_URL=https://$BACKEND_SERVICE-$REGION.a.run.app

gcloud run deploy $BACKEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$IMAGE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8001 \
  --memory 1Gi \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars OPENAI_API_KEY=sk-***,SUPABASE_URL=https://***,SUPABASE_SERVICE_ROLE_KEY=***,SUPABASE_ANON_KEY=***,CLAIMEASE_SESSION_SECRET=***,GEMINI_API_KEY=***,GEMINI_RECEIPT_MODEL=gemini-2.5-flash,KNOWLEDGE_BASE_SOURCE=supabase,DISABLE_KNOWLEDGE_BASE=0,BENEFIT_INELIGIBLE_COUNTRIES=France,Malta
```

> **Security tip:** Instead of plain `--set-env-vars`, use Secret Manager:
> ```bash
> echo -n "VALUE" | gcloud secrets create claimease-secret --data-file=-
> gcloud run services update $BACKEND_SERVICE --set-secrets CLAIMEASE_SESSION_SECRET=claimease-secret:1
> ```

Test the deployment:
```bash
curl "$BACKEND_URL/health"
```

---

## 3. Deploy Frontend Service (optional)

### 3A. Using the Google Cloud Console (UI)
If you ever decide to host the Next.js frontend on Cloud Run instead of Vercel:
1. Go back to https://console.cloud.google.com/run and click **Create Service** again.
2. Select the same container image (`gcr.io/PROJECT_ID/claimease`) but set **Container port** to `3000`.
3. Under **Environment variables**, provide the Next.js public values (API URL, Supabase anon key, table names, etc.).
4. Give it at least `1 GiB` memory and enable unauthenticated access.
5. Deploy and, once ready, update DNS or your Vercel settings to point to the new URL if you switch over.

If you prefer Cloud Run for the Next.js app instead of Vercel:

```bash
FRONTEND_SERVICE=claimease-web
FRONTEND_URL=https://$FRONTEND_SERVICE-$REGION.a.run.app

gcloud run deploy $FRONTEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$IMAGE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --set-env-vars NEXT_PUBLIC_API_URL=$BACKEND_URL,NEXT_PUBLIC_SUPABASE_URL=https://***,NEXT_PUBLIC_SUPABASE_ANON_KEY=***,CLAIMEASE_SESSION_SECRET=***,NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE=claim_summary,NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE=claim_analysis,NEXT_PUBLIC_SUPABASE_EMPLOYEE_TABLE=employee_email,NEXT_PUBLIC_BENEFIT_INELIGIBLE_COUNTRIES=France,Malta
```

If you keep the frontend on Vercel, just set `NEXT_PUBLIC_API_URL` there to the Cloud Run backend URL and skip this step.

---

## 4. Configure Secrets with Secret Manager (recommended)

### 4A. Using the Google Cloud Console (UI)
1. Open https://console.cloud.google.com/security/secret-manager.
2. Click **Create Secret**, give it a name (e.g., `claimease-openai-key`), paste the secret value, and save.
3. Repeat for every sensitive value (Supabase keys, session secret, etc.).
4. Return to the Cloud Run service → **Edit & deploy new revision** → **Variables & Secrets**.
5. Under **Secrets** click **Add Secret**, pick the secret, and map it to the desired env var name.
6. Deploy the revision; Cloud Run now injects the values securely.

Example:
```bash
echo -n "sk-..." | gcloud secrets create claimease-openai-key --data-file=-
gcloud run services update $BACKEND_SERVICE \
  --set-secrets OPENAI_API_KEY=claimease-openai-key:1 \
  --set-secrets SUPABASE_SERVICE_ROLE_KEY=claimease-supabase-role:1 \
  --set-secrets CLAIMEASE_SESSION_SECRET=claimease-session-secret:1
```

Repeat for all sensitive keys. Keep non-sensitive public values (e.g. table names) as standard env vars.

---

## 5. Custom Domains & HTTPS

1. Reserve domain: `gcloud run domain-mappings create --service $FRONTEND_SERVICE --domain claims.yourdomain.com`.
2. Add the DNS records provided by Cloud Run.
3. HTTPS certs are provisioned automatically.

For backend, you can keep the default `*.a.run.app` URL or map a subdomain (e.g., `api.claims.yourdomain.com`) similarly.

---

## 6. Autoscaling & Observability

- Scaling: `--min-instances 1 --max-instances 10 --concurrency 40`.
- Logs: view in Cloud Logging (filter by resource type “Cloud Run Revision”).
- Monitoring: create alerting policies for error rate or latency.

Example to update autoscaling:
```bash
gcloud run services update $BACKEND_SERVICE \
  --region $REGION \
  --min-instances 1 \
  --max-instances 10 \
  --concurrency 40
```

---

## 7. Promotion Flow

1. Tag release: `git tag v1.0.0 && git push --tags`.
2. `gcloud builds submit` using the tag.
3. Deploy new revision via `gcloud run deploy`.
4. Smoke test via `/health` and frontend UI.
5. Optionally use traffic splitting: `gcloud run services update-traffic $FRONTEND_SERVICE --to-revisions new=20,old=80`.

---

### References
- `docs/ENVIRONMENT_CREDENTIALS.md` – all required env vars.
- `docs/DEPLOYMENT_PLAN.md` – overall UAT → Prod promotion steps.
- Cloud Run docs: https://cloud.google.com/run/docs

This guide gives you the commands needed to move directly to Cloud Run without relying on Render. Adjust regions, instance sizes, and autoscaling limits to match your throughput requirements.***
