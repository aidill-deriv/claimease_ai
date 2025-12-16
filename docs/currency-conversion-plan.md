# Currency Conversion Plan

## Goals
- Convert each claim entry amount from its source currency to the selected Local Currency in real time.
- Display per-claim conversion details (original → converted) and sum totals in Local Currency in the Summary section.
- Persist both original amounts and the conversion snapshot used at submission for auditability.

## Assumptions
- XE (or similar) rates require outbound network; needs approval in this environment.
- Supported currencies: existing options in the form (e.g., MYR, AED, USD, EUR, GBP, SGD, AED, AUD, JPY, IDR, Other). “Other” will require manual entry or will be blocked if no rate is available.
- Rates can be considered fresh for 6–12 hours; users expect same-day consistency.

## API & Caching
- Add `/api/fx-rates`:
  - Input: `base` (Local Currency), optional `force=true` to refresh.
  - Output: `{ base, rates: Record<string, number>, fetchedAt, provider, source }`.
  - Fetcher: call XE; on failure, return last good cache or a static fallback map with `source: "fallback"`.
- Cache strategy:
  - In-memory map keyed by `base`; store `rates`, `fetchedAt`, `provider`.
  - TTL: 12h; refresh on expiry or when `force=true`.
  - Optional: persist to a small JSON file under `tmp/.cache/fx-rates.json` for restart resilience.

## Frontend Integration
- On Step 2/4 load (or when `localCurrency` changes), fetch rates for `localCurrency`.
- Maintain `ratesState`: loading/error/fallback; show “Rates unavailable” banner and block review/submit if any claim currency is missing.
- Recompute per-entry `convertedAmount` whenever amount/currency/localCurrency/rates change.
- Show per-claim line: `420 AED → 540 MYR (1 AED = 1.2857 MYR at 2024-09-01)`.
- Summary totals: sum `convertedAmount` in Local Currency; keep original amounts visible on hover or in a list.
- Disable submission if:
  - No rate for a claim’s currency (and not equal to Local Currency).
  - Rates fetch failed and no fallback is present.

## Submission Payload & Metadata
- For each entry: store `original_amount`, `original_currency`, `converted_amount`, `converted_currency` (Local Currency).
- In metadata: include the `fxSnapshot` with `base`, `rates`, `fetchedAt`, `provider`, `source`.
- Store total amount in Local Currency for Finance processing.

## Testing
- Unit tests for conversion utility: same-currency passthrough, different-currency conversion, missing-rate handling.
- UI tests: block submit when rate missing; display converted rows; recalculates when local currency changes.
- API tests: cache hit/TTL expiry, fallback on fetch failure, `force=true` refresh.

## Open Questions / Config
- Do we need to whitelist currencies, or allow ad-hoc three-letter codes if XE returns them?
- Acceptable TTL? Default 12h unless specified.
- Should we add a manual override for rates (e.g., finance-provided static map) when XE is unreachable?
