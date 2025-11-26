# Supabase Connection & Verification Plan

## 1. Environment & Client Wiring
- Credentials live in `.env.local` via the `NEXT_PUBLIC_SUPABASE_*` variables (URL, anon key, table names, storage bucket). These are read by `lib/supabase-client.ts` to instantiate the singleton Supabase client that the rest of the app imports.
- Dashboard-specific env vars: `NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE=claim_summary` and `NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE=claim_analysis`. `NEXT_PUBLIC_SUPABASE_CLAIMS_TABLE` remains available for claim submissions, while `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` points at `claim_receipts`.
- Server-only access now uses `SUPABASE_SERVICE_ROLE_KEY` via `lib/supabase-service-client.ts`, powering the `/api/dashboard-data` route so browser clients never see the service credential.
- Keep the variables in sync with Supabase dashboard table names. At the moment we only need the four canonical tables: `employee_email`, `claim_summary`, `claim_analysis`, `claim_purchasing` (unused for this iteration).
- After editing `.env.local`, restart Next.js so the client rebuilds with the updated values.

## 2. Dashboard Data Source Mapping
Based on `supabase_schema/supabase-dashboard-connection.md` and the clarified scope:

| Dashboard Section | Supabase Table | Notes |
| --- | --- | --- |
| Top cards (Used Amount, Remaining Balance, Entitlement) | `claim_summary` | Filter by `email = '{authenticated_user_email}'`. Use `total_transaction_amount`, `remaining_balance`, `max_amount`. |
| Recent Claims, Category spend, Yearly trend | `claim_analysis` | Filter by `email`, `state != 'Complete'`, `claim_type = 'Employee Benefit'`. Use `transaction_amount`, `transaction_currency`, `claim_type`/`claim_description` for grouping. |
| Claim receipts upload | `claim_analysis` (records) + Supabase Storage bucket `claim_receipts` | Metadata (amount, type, status) stays in `claim_analysis`; file paths stored in the storage bucket. |
| Claim purchasing | `claim_purchasing` | Not consumed yet; keep for future visa/attestation workflows. |

## 3. Live Verification Results
- Ran `node` diagnostics (see command history) that initialize the Supabase client with `.env.local` and query all four tables plus `information_schema.columns`.
- Table queries succeeded but returned zero rows because RLS prevents anon access without an authenticated user/email context. No structural errors surfaced, so tables exist but require user-level sessions to expose data.
- Metadata queries against `information_schema` are blocked for anon role; we must rely on the documented schema (`database_schema_documentation.md`) or create a service-role function if deeper inspection is needed.

## 4. Next Steps
1. (Optional) Layer Supabase Auth on top of the existing service-route approach if end-user email verification is required beyond the sessionStorage stub.
2. Update `lib/supabase-dashboard.ts` to pull the top card metrics directly from `claim_summary` (removing the placeholder `benefit_balances`/`monthly_spending` tables) and build the trend/category datasets from filtered `claim_analysis`.
3. Keep `supabase_schema/database_schema_documentation.md` aligned with any schema migrations; document new columns/relationships as they ship.
4. When `claim_purchasing` joins the dashboard, extend the plan with the vendor/status fields already captured in its schema section.
