# ClaimEase Changelog (Agent Updates)

## Travel Claims Dashboard
- Added travel data layer with class_id → display_category mapping from `supabase_schema/travel_category.md` (`lib/travel-dashboard.ts`).
- Created secure API endpoint `app/api/travel-dashboard/route.ts` (requires session/email match).
- Built `app/travel/page.tsx` with year dropdown (auto-populated from data), category badges, totals, filtered counts, and claims list. Shows skeleton placeholders while fetching.
- Navigation updated to include “Travel Claims” link (Plane icon) in `components/navigation.tsx`; legacy nav updated in `react_app/components/navigation.tsx`.

## Loading Skeletons
- Employee Benefit dashboard (`app/dashboard/page.tsx`): shimmering skeletons for summary cards and recent claims while loading.
- AI Chat (`app/chat/page.tsx`): skeleton header and message list during session load/initial fetch.
- Submit Claim (`app/submit-claim/page.tsx`): skeletons for summary cards, form sections, and claim list instead of blank spinner.
- Travel page (`app/travel/page.tsx`): skeletons for cards and claims list during initial fetch.

## Other UI/Metadata Tweaks
- Submit Claim nav uses Send icon; Dashboard tab title set to “ClaimEase - Employee Benefit” (`app/layout.tsx`).
- Recent Claims filters: Employee Benefits default to current year with toggle; Travel counts filtered by selected year.

## Notes
- Next.js app expects Node ≥18 (project now on Node 20). `react_app/` is legacy and not used by the current Next.js build.
