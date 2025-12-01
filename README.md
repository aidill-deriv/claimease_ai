# ClaimEase Employee Benefits Portal

AI-assisted employee benefits experience with a modern Next.js frontend, Python FastAPI backend, and Supabase-powered data pipelines.

---

## Highlights
- 📊 **Employee dashboard** – live balance, recent claims, processing stats, and benefit eligibility pulled from Supabase.
- 🤖 **AI claim assistant** – chat UI backed by the LangChain agent in `src/ai_agent.py`.
- 🧾 **Smart claim submission** – receipt upload, OCR toggle, and contextual autofill from `employee_email`.
- 🛡️ **Role-based admin console** – manage allowed users plus superadmin-only impersonation to investigate any employee email without needing their password.
- 🌐 **Edge-friendly networking** – Cloudflare tunnel support so `/api` requests automatically proxy to whichever backend URL you expose.

---

## Tech Stack
- **Frontend:** Next.js 14, React 18, Tailwind, Radix UI, TypeScript.
- **Backend:** FastAPI (served via `uvicorn`), LangChain agent, Python 3.9+.
- **Data:** Supabase (employee_email, claim_summary, claim_analysis), ChromaDB, local SQLite.
- **Auth:** Custom session tokens stored in browser sessionStorage with viewer/admin/superadmin roles.

---

## Repository Layout
```
app/                     # Next.js routes (dashboard, chat, admin, API proxies)
components/              # Shared UI components (navigation, cards, forms)
hooks/                   # React hooks (session, theme helpers)
lib/                     # Frontend utilities (API client, Supabase helpers, auth)
src/                     # FastAPI backend + AI agent
  api.py                 # ASGI entrypoint used by `npm run backend`
  ai_agent.py            # LangChain agent + tools
config/                  # Python requirements + .env template
supabase_schema/         # Reference docs for Supabase tables
docs/                    # How-tos (Cloudflare tunnel, deployment, etc.)
```

---

## Prerequisites
- Python **3.9+**
- Node.js **18+**
- Supabase project with the `employee_email`, `claim_summary`, and `claim_analysis` tables populated
- `CLAIMEASE_SESSION_SECRET`, Supabase service-role key, and anon key values

---

## Setup

1. **Clone & install dependencies**
   ```bash
   git clone <repo-url>
   cd claim_web_app_project
   python3 -m venv venv
   source venv/bin/activate            # Windows: venv\Scripts\activate
   pip install -r config/requirements.txt
   npm install
   ```

2. **Configure environment**
   - Copy `config/.env.example` → `config/.env`, then set:
     - `CLAIMEASE_SESSION_SECRET`
     - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
     - Optional table overrides (e.g. `SUPABASE_ALLOWED_USERS_TABLE`)
   - Copy `.env.example` → `.env.local` (if present) or create one with:
     ```bash
     NEXT_PUBLIC_API_URL=http://localhost:8001
     NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
     NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE=claim_summary
     NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE=claim_analysis
     NEXT_PUBLIC_SUPABASE_EMPLOYEE_TABLE=employee_email
     NEXT_PUBLIC_ENABLE_RECEIPT_OCR=false
     ```

---

## Running Locally

Open **two terminals** from the repo root:

```bash
# Terminal 1 – FastAPI backend
npm run backend          # wraps: python3 -m uvicorn src.api:app --host 0.0.0.0 --port 8001

# Terminal 2 – Next.js frontend
npm run dev              # serves http://localhost:3000
```

Login at `http://localhost:3000/` using an email that exists in `claim_allowed_users`. Superadmins can access `/admin/impersonate` to jump into any email from `employee_email` (viewer role) without needing to seed the allowed-users table.

---

## Cloudflare Tunnel (optional)

To expose both services without opening ports:
1. Start the backend (`npm run backend`) and frontend (`npm run dev`).
2. Run Cloudflare tunnels for each port, e.g.:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   cloudflared tunnel --url http://localhost:8001
   ```
3. Share only the frontend URL; its `/api` proxy automatically hits the backend tunnel.  
Detailed notes live in `docs/1-cloudflare-tunnel-notes.md`.

---

## Admin & Impersonation
- `/admin` – manage allowed users (viewer/admin/superadmin) and see usage stats.
- `/admin/impersonate` – **superadmin only**. Enter any email found in `employee_email` to instantly swap your session to that account (viewer access). Your previous session is replaced; log out to revert to your own account.

Backend validation lives in `app/api/admin/impersonate/route.ts` and mints a synthetic viewer session if the email is missing from `claim_allowed_users` but present in Supabase.

---

## Helpful Scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js in development mode |
| `npm run build` / `npm start` | Production build & serve |
| `npm run lint` | ESLint via `next lint` |
| `npm run backend` | Launch FastAPI backend with uvicorn |
| `python src/db_setup.py` | Initialize local SQLite DB (if needed) |

---

## Testing & Verification
- **Frontend lint:** `npm run lint`
- **Backend smoke:** use `curl`/Postman against `http://localhost:8001/docs`
- **Session check:** `sessionStorage` should hold `claimease.session` after login/impersonation

For more background (schema diagrams, deployment steps, troubleshooting), browse the `docs/` and `supabase_schema/` folders.

---

Happy shipping! 🎉
