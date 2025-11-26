# Supabase Dashboard Connection Notes

## Database Configuration
- **Connection**: Supabase (not local)
- **Environment Variables**: URL and anon key in `env.local`

## Tables Required
1. `claim_summary`
2. `claim_analysis`
3. `claim_purchasing`

## Query Specifications

### Dashboard Metrics

**Used Amount** (`total_transaction`)
```sql
SELECT total_transaction_amount 
FROM claim_summary
WHERE email = '{authenticated_user_email}'
```

**Remaining Balance** (`balance`)
```sql
SELECT remaining_balance 
FROM claim_summary
WHERE email = '{authenticated_user_email}'
```

**Entitlement** (`max_amount`)
```sql
SELECT max_amount 
FROM claim_summary
WHERE email = '{authenticated_user_email}'
```

### claim_analysis Table Queries

**For: Yearly Spending Trend, Recent Claims, Spending by Category**
```sql
SELECT * 
FROM claim_analysis
WHERE email = '{authenticated_user_email}'
  AND state != 'Complete'
  AND claim_type = 'Employee Benefit'
```

### Key Requirements
- **Email Filter**: Use authenticated user's email for all queries
- **State Exclusion**: Exclude `state = 'Complete'`
- **Claim Type Filter**: Filter by `claim_type = 'Employee Benefit'` for spending analysis
- **Currency Display**: Use `transaction_currency` field for all currency symbols
- **Server Proxy**: Frontend hits `/api/dashboard-data` which uses the Supabase service-role key so browser clients never see privileged credentials.

### Implementation Checklist
- [x] `.env.local` provides Supabase URL/key plus `NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE=claim_summary` and `NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE=claim_analysis`.
- [x] `lib/supabase-dashboard.ts` consumes `claim_summary` for balance cards and `claim_analysis` for charts + recent claims, applying the filters above.
- [x] `scripts/check-supabase.mjs` validates connectivity/counts (`node scripts/check-supabase.mjs [email?]`).
- [x] Service-route (`/api/dashboard-data`) backed by the Supabase service-role key enables RLS-protected reads.
- [x] Production data load confirmed via the service-role verification script (see command history for sample rows).

### Employee Benefit Eligibility Gate
- Some countries are fully covered by local insurance, so their employees should not see the Employee Benefits dashboard cards/charts.
- The API now looks up the employee's country from `employee_email` (falls back to `claim_summary.country`) and returns `isBenefitRestricted` plus `employeeCountry`.
- Define `BENEFIT_INELIGIBLE_COUNTRIES` (or `NEXT_PUBLIC_BENEFIT_INELIGIBLE_COUNTRIES`) as a comma-separated list in `.env.local` to control the restriction list. Default: `France,Malta`.
- The frontend replaces the dashboard widgets with an info card whenever `isBenefitRestricted` is true, so adding/removing countries only requires updating the env var and refreshing the page.
