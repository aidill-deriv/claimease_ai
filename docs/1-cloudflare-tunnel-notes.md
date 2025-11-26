# Cloudflare Tunnel Sharing Notes

Date: <!-- YYYY-MM-DD -->  
Change owner: AI assistant (Codex CLI)

## Context
When exposing the local app via `cloudflared tunnel --url http://localhost:3000`, remote teammates could load the UI but the chat feature failed because the browser attempted to call `http://localhost:8001` directly (based on `NEXT_PUBLIC_API_URL`). From a remote machine that host name resolves to their own device, so the request never reaches your FastAPI backend.

## Change
- `lib/api.ts`: 
  - Default API base now falls back to `/api`.
  - On the browser, any `NEXT_PUBLIC_API_URL` value that points to `localhost` is ignored in favor of `/api`, ensuring Cloudflare/other tunnels keep working even if `.env` still targets `localhost:8001`.
- `app/chat/page.tsx`: Error message reports the resolved API base for easier debugging.

No configs were replaced—only an additional relative-path fallback was introduced.

## How to Revert
1. Restore `lib/api.ts` to use `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'` and remove the runtime fallback logic/export if not needed elsewhere.
2. Update `app/chat/page.tsx` to inline the fallback string in the error message again.

After reverting, remote teammates must set `NEXT_PUBLIC_API_URL` to their exposed backend URL (e.g., the Cloudflare 8001 tunnel) to make chat work.

## How to Run for UAT

1. **Backend** – `npm run backend` (or `python -m uvicorn src.api:app --host 0.0.0.0 --port 8001`)  
2. **Frontend** – `npm run dev` (Next.js proxy rewrites `/api/*` → `http://localhost:8001/*`)  
3. **Cloudflare tunnels** (separate terminals)  
   ```bash
   cloudflared tunnel --url http://localhost:3000
   cloudflared tunnel --url http://localhost:8001
   ```  
4. Share the Cloudflare URL from step 1 with testers. Browsers will auto-route chat traffic through `/api`, so no `.env` changes are needed on their side.
