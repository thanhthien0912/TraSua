# S03: Skeleton Loaders + Error UX Polish

**Goal:** Add skeleton loaders during data fetch and error states with retry buttons across customer, staff, and admin pages.
**Demo:** On slow network (throttled in DevTools), customer menu shows skeleton cards during fetch. Staff station views show skeleton order cards. Admin lists show skeleton rows. Network error on any page shows Vietnamese error state with retry button.

## Must-Haves

- On slow network (throttled in DevTools), customer menu shows skeleton cards during fetch. Staff station views show skeleton order cards. Admin lists show skeleton rows. Network error on any page shows Vietnamese error state with retry button.

## Proof Level

- This slice proves: demo

## Integration Closure

S03 builds on S01 admin shell and S02 table management. Skeletons and error states apply to all pages. No downstream cross-boundary wiring needed.

## Verification

- Error boundaries log network failures.

## Tasks

- [x] **T01: Add skeleton loaders to all pages** `est:45m`
  Add skeleton loaders to customer /order page, staff station pages, and admin pages. Show skeleton cards during initial data fetch (loading state). Use CSS-based skeleton animations (no JS library). Use amber/cream color scheme matching the app's warm palette.
  - Files: `src/app/order/page.tsx`, `src/components/order/MenuView.tsx`, `src/components/staff/StationView.tsx`, `src/app/admin/menu/page.tsx`, `src/app/admin/tables/page.tsx`, `src/app/admin/qr/page.tsx`
  - Verify: DevTools throttling shows skeletons; build succeeds

- [x] **T02: Add error states with retry to all pages** `est:30m`
  Add network error states with Vietnamese error messages and retry buttons to all pages. Error state shows when fetch fails. Retry button re-triggers the fetch. Follow Toast error pattern for consistency.
  - Files: `src/app/order/page.tsx`, `src/app/staff/bar/page.tsx`, `src/app/staff/kitchen/page.tsx`, `src/app/staff/checkout/page.tsx`, `src/app/admin/menu/page.tsx`, `src/app/admin/tables/page.tsx`, `src/app/admin/qr/page.tsx`
  - Verify: Error states show on network failure; retry works

- [x] **T03: Verify all tests pass** `est:15m`
  Run all tests to ensure skeleton and error state additions don't break existing functionality. Verify build succeeds.
  - Files: `All modified files`
  - Verify: npx vitest run passes; next build succeeds

## Files Likely Touched

- src/app/order/page.tsx
- src/components/order/MenuView.tsx
- src/components/staff/StationView.tsx
- src/app/admin/menu/page.tsx
- src/app/admin/tables/page.tsx
- src/app/admin/qr/page.tsx
- src/app/staff/bar/page.tsx
- src/app/staff/kitchen/page.tsx
- src/app/staff/checkout/page.tsx
- All modified files
