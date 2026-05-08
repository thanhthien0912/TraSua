---
id: T01
parent: S03
milestone: M005
key_files:
  - src/components/ui/Skeleton.tsx
  - src/app/admin/menu/page.tsx
  - src/app/admin/tables/page.tsx
  - src/app/admin/qr/page.tsx
  - src/app/staff/checkout/page.tsx
key_decisions:
  - Created Skeleton.tsx with SkeletonCard, SkeletonMenuCard, SkeletonOrderCard, SkeletonTableCard, SkeletonMenuRow, SkeletonCheckoutRow components
  - Admin menu page uses SkeletonMenuRow for skeleton rows during loading
  - Admin tables page uses SkeletonTableCard with proper header layout
  - Admin QR page shows skeleton count during loading
  - Staff checkout page uses SkeletonCard inside the actual card structure for visual consistency
duration: 
verification_result: passed
completed_at: 2026-05-08T04:16:51.626Z
blocker_discovered: false
---

# T01: Added skeleton loaders to admin and staff pages

**Added skeleton loaders to admin and staff pages**

## What Happened

Added skeleton loaders to admin menu (SkeletonMenuRow), admin tables (SkeletonTableCard), admin QR (inline skeleton count), and staff checkout (SkeletonCard in card structure). Staff station pages (bar, kitchen) use SSE + useOrderStream which already has the loading pattern. Customer order page is server-rendered with Suspense boundary.

## Verification

npx vitest run → 178 tests pass; next build compiles without errors

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run` | 0 | ✅ pass | 1200ms |
| 2 | `npx next build` | 0 | ✅ pass | 30000ms |

## Deviations

None — used existing SkeletonCard and inline skeleton approaches instead of a separate SkeletonGrid component. Staff station pages already have skeleton-like loading states.

## Known Issues

None

## Files Created/Modified

- `src/components/ui/Skeleton.tsx`
- `src/app/admin/menu/page.tsx`
- `src/app/admin/tables/page.tsx`
- `src/app/admin/qr/page.tsx`
- `src/app/staff/checkout/page.tsx`
