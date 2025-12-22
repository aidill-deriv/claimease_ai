# ClaimEase Workflows (User-Facing Features)

## Authentication & Roles
- Login: email must exist in `claim_allowed_users`; session token stored in `sessionStorage` (`claimease.session`).
- Roles: viewer, admin, superadmin. Superadmins can impersonate via `/admin/impersonate` (injects synthetic viewer session).
- Unauthorized users redirected to `/no-access` or `/` depending on page.

## Navigation
- Left nav (desktop) / top nav (mobile): Employee Benefits (dashboard), Travel Claims, AI Chat, Submit Claim, Admin (role-gated), theme toggle, user menu.
- Travel and Submit Claim entries are always visible to authenticated users; Admin only for admin/superadmin.

## Employee Benefits Dashboard (`/dashboard`)
- Data source: Supabase `claim_summary` / `claim_analysis` (Employee Benefit claims only).
- Features: balance snapshot, usage bars, remaining/used, processing stats, recent claims.
- Filters: Recent Claims default to current year; “View All Years” toggle shows all years. Claims grouped by year.
- Icons: category-specific (dental/optical/health fallback) with dark-mode friendly colors; status badges use shared palette.
- Loading: skeleton placeholders for summary cards and recent claims.

## Travel Dashboard (`/travel`)
- Data source: Supabase `claim_analysis` filtered to `claim_type = 'Travel Reimbursement'` and `state != 'Complete'`.
- Category mapping: `supabase_schema/travel_category.md` (class_id → display_category).
- Features: year dropdown (populated from claim years + “All”), category pie chart with legend, totals, open-claim count (filtered by selected year), claim list with status badges.
- Icons: Plane/Train with dark-mode friendly colors; status colors aligned with Employee Benefits.
- Loading: skeleton placeholders for summary cards, pie chart, and claims list.

## AI Chat (`/chat`)
- Backed by LangChain agent (`src/ai_agent.py`) via `/api` calls; persists session/thread in `sessionStorage`.
- Quick question buttons; message history restored per user; feedback (thumbs up/down) posts to `/api` feedback endpoint.
- Loading: skeleton header and message list on initial load/hydration.

## Submit Claim (`/submit-claim`)
- Multi-step form: Upload Receipt → Claim Details → Supporting Documents.
- Multiple entries per submission; fields include description, amount, currency, service date, claimant name, merchant, benefit type hints, etc.
- Balance-aware: fetches balance via `fetchDashboardData`; shows remaining/used and overage warnings.
- OCR (AI): optional receipt upload to `/api/receipt-ocr` auto-fills description, amount, currency, service date, merchant, claimant, and optical hints.
- Duplicate check: `/api/receipt-duplicate-check` flags potential duplicates via receipt hash.
- FX support: fetches FX rates; shows converted amounts for mismatched currencies.
- Status/UX: inline statuses for OCR, duplicates, submission; skeletons on initial load; status badges align with dashboard palette.
- On success: clears state and redirects to `/dashboard` after a brief success message.

## Admin Console (`/admin`, `/admin/impersonate`)
- Manage allowed users and roles (viewer/admin/superadmin).
- Impersonation: superadmin-only; enter any email in `employee_email` to assume a viewer session for troubleshooting; replaces current session.

## API & Data Notes
- Frontend Supabase fetchers: `lib/supabase-dashboard.ts` (benefits) and `lib/travel-dashboard.ts` (travel).
- Service-side endpoints: `/api/dashboard-data` (benefits) and `/api/travel-dashboard` (travel) enforce session/email match.
- OCR/Duplicate endpoints: `/api/receipt-ocr`, `/api/receipt-duplicate-check`.
- Tables: `employee_email`, `claim_summary`, `claim_analysis` (plus class_id mapping for travel).

## Environment & Tooling
- Node 18+ (Node 20 recommended), Python 3.9+.
- Run: `npm run dev` (frontend) and `npm run backend` (FastAPI).
- Lint: `npm run lint` (requires Node ≥18.17).
- Legacy `react_app/` is not used by the current Next.js app.
