# ClaimEase Runbook

Step-by-step guide for starting every part of the project (frontend, backend, and diagnostics) on a fresh environment. This assumes you have already cloned the repository.

---

## 1. Prerequisites

- Node.js 18+ (for the Next.js frontend)
- Python 3.9+ (for the FastAPI backend)
- npm (bundled with Node)
- pip3
- Supabase project credentials (URL + anon key + service-role key)
- OpenAI API key

---

## 2. Install Dependencies

```bash
# Frontend packages
npm install

# Backend / AI packages
pip3 install -r config/requirements.txt
pip3 install -r config/requirements_ai.txt
pip3 install -r config/requirements_kb.txt
```

> **Tip:** If you only need the Supabase-backed AI features (and not the knowledge base), you can skip `requirements_kb.txt` and set `DISABLE_KNOWLEDGE_BASE=1` in `config/.env`.

---

## 3. Configure Environment Files

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_SUPABASE_URL=...your supabase url...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...anon key...
NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE=claim_summary
NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE=claim_analysis
NEXT_PUBLIC_SUPABASE_CLAIMS_TABLE=claims
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=claim_receipts
SUPABASE_SERVICE_ROLE_KEY=...service role key...   # required for /api/dashboard-data
```

### Backend (`config/.env`)
```
OPENAI_API_KEY=...
MODEL_NAME=gpt-4o
LOCAL_USER_EMAIL=your.email@company.com
LOG_LEVEL=INFO
PORT=8001

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...same service key...
SUPABASE_SUMMARY_TABLE=claim_summary
SUPABASE_ANALYSIS_TABLE=claim_analysis

# Set to 1 if you want to skip loading the knowledge base (useful on offline/dev machines)
DISABLE_KNOWLEDGE_BASE=1
```

> **Reminder:** Keep the service-role key out of version control. `.env.local` and `config/.env` are gitignored.

---

## 4. Start the Backend (FastAPI)

```
npm run backend
```

Common flags:
- Use `DISABLE_KNOWLEDGE_BASE=1` (already set above) if you’re offline; otherwise the Chroma/HuggingFace download will fail.
- The backend logs whether Supabase credentials or Slack secrets are missing. Missing Slack envs are fine unless you’re wiring Slack.

---

## 5. Start the Frontend (Next.js)

```
npm run dev
```

The app runs on http://localhost:3000. The dashboard and AI chat both call the backend on http://localhost:8001, so leave both processes running.

---

## 6. Verification Commands

1. **Supabase connectivity (front-end env)**  
   ```
   npm run verify:supabase -- user@example.com
   ```
   This uses the service-role key (if present) and prints sample rows from `claim_summary` / `claim_analysis`.

2. **Dashboard API health**  
   ```
   curl -X POST http://localhost:3000/api/dashboard-data \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com"}'
   ```
   A successful response contains the `balance`, `monthlySpending`, `categorySpending`, and `recentClaims` JSON sections.

3. **FastAPI health**  
   ```
   curl http://localhost:8001/health
   ```

---

## 7. Common Troubleshooting

| Symptom | Likely Fix |
| --- | --- |
| Dashboard banner “We’re having trouble syncing…” with a Supabase column error | Ensure the column exists in Supabase; we removed `invoice_no`, so update env/queries if needed. |
| Supabase error `fetch failed` in the console | Typically missing `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` or `.env`—front end can’t hit `/api/dashboard-data`. |
| Backend fails trying to download the HuggingFace model | Set `DISABLE_KNOWLEDGE_BASE=1` in `config/.env` and restart uvicorn. |
| Port 8001 “operation not permitted” | Another process is bound; run `lsof -i :8001` and kill the PID. |
| Frontend 3000 “EPERM” | macOS privacy setting; give your Terminal Full Disk Access and rerun `npm run dev`. |

---

## 8. Shutdown

Ctrl+C both the `uvicorn` and `npm run dev` processes. No extra cleanup needed.

---

That’s it! Following the steps above brings up both the backend AI API and the Supabase-powered dashboard with correct currency-aware metrics.
