# Environment Credentials Reference

Centralized list of every environment variable the ClaimEase stack uses across local dev, UAT (Vercel + Render), and Production (Cloud Run). Duplicate these values exactly per environment so sessions stay valid and both tiers talk to the same Supabase project.

> ⚠️ **Do not commit secrets.** Keep this file for reference only and store real values in your password manager, Render/Vercel dashboards, or Secret Manager.

---

## 1. Core Secrets (required everywhere)

| Key | Description | Example / Notes |
| --- | --- | --- |
| `CLAIMEASE_SESSION_SECRET` | HMAC secret for session tokens. Must match frontend + backend in the same environment. | Generate a long random string. |
| `SUPABASE_URL` | Supabase project base URL (server-side). | `https://xyzcompany.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only). | Store in Render / Cloud Run secrets. |
| `SUPABASE_ANON_KEY` | Supabase anon/public key (required client-side). | Exposed via `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| `OPENAI_API_KEY` | GPT key for the AI agent & chat. | Format `sk-...`. |
| `GEMINI_API_KEY` | Google Generative AI key for receipt OCR. | Needed if OCR enabled. |
| `GEMINI_RECEIPT_MODEL` | Optional override of the OCR model. | Default `gemini-2.5-flash`. |

---

## 2. Frontend (Vercel / Cloud Run web) – Public Vars

Set these in Vercel (Production + Preview) or Cloud Run if you host the Next.js app there.

| Key | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend. | `https://claimease-api.onrender.com` (UAT) |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as `SUPABASE_URL` but safe for browser. | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-safe anon key. | Copy from Supabase dashboard. |
| `NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE` | Claim summary table name. | `claim_summary` |
| `NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE` | Claim analysis table name. | `claim_analysis` |
| `NEXT_PUBLIC_SUPABASE_EMPLOYEE_TABLE` | Employee directory table. | `employee_email` |
| `NEXT_PUBLIC_ENABLE_RECEIPT_OCR` | `"true"` / `"false"` toggle. | Sync with backend flag. |
| `NEXT_PUBLIC_BENEFIT_INELIGIBLE_COUNTRIES` | CSV list for restricted benefits. | `France,Malta` |

---

## 3. Backend (Render / Cloud Run API) – Server Vars

Add the core secrets plus the following:

| Key | Description | Example |
| --- | --- | --- |
| `ENABLE_RECEIPT_OCR` | Mirrors `NEXT_PUBLIC_ENABLE_RECEIPT_OCR`. | `true` |
| `KNOWLEDGE_BASE_SOURCE` | `supabase` or `local`. | `supabase` |
| `DISABLE_KNOWLEDGE_BASE` | `"true"` to turn off KB usage. | `false` |
| `KNOWLEDGE_BASE_COUNTRY` | Restrict KB search. | `global` |
| `SUPABASE_ALLOWED_USERS_TABLE` | Optional override. | `claim_allowed_users` |
| `SUPABASE_EMPLOYEE_PROFILE_TABLE` | Optional override. | `employee_email` |
| `BENEFIT_INELIGIBLE_COUNTRIES` | Server-side mirror of the CSV list. | `France,Malta` |
| `SLACK_BOT_TOKEN` | Only if Slack integration enabled. | `xoxb-...` |
| `SLACK_SIGNING_SECRET` | Slack verification secret. | `abcd1234` |

---

## 4. Local Development `.env` Snapshot

Create/verify these files:

### `config/.env`
```
CLAIMEASE_SESSION_SECRET=local-dev-secret
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key
OPENAI_API_KEY=sk-********
GEMINI_API_KEY=AIza********
GEMINI_RECEIPT_MODEL=gemini-2.5-flash
ENABLE_RECEIPT_OCR=true
KNOWLEDGE_BASE_SOURCE=supabase
DISABLE_KNOWLEDGE_BASE=false
BENEFIT_INELIGIBLE_COUNTRIES=France,Malta
```

### `.env.local` (Next.js)
```
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE=claim_summary
NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE=claim_analysis
NEXT_PUBLIC_SUPABASE_EMPLOYEE_TABLE=employee_email
NEXT_PUBLIC_ENABLE_RECEIPT_OCR=true
NEXT_PUBLIC_BENEFIT_INELIGIBLE_COUNTRIES=France,Malta
CLAIMEASE_SESSION_SECRET=local-dev-secret
```

---

## 5. Copy/Paste Checklist for UAT

1. **Render (backend)** – add all keys from Sections 1 & 3.
2. **Vercel (frontend)** – add Section 1 keys as *Server* vars, Section 2 keys as *Public* vars.
3. **Validate** – run `npm run build` locally before pushing, then smoke-test Vercel URL against Render API.

Use this document as the canonical reference each time you promote to a new environment or rotate secrets. Rename variables only after updating this list so every tier stays consistent.***
