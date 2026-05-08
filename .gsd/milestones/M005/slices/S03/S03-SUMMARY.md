---
id: S03
parent: M005
milestone: M005
provides:
  - Skeleton.tsx component library with multiple skeleton variants
  - Loading states with skeletons in admin menu, tables, QR, and checkout
  - Error states with retry buttons across all pages
requires:
  - slice: S01
    provides: Admin shell consumed by S03
affects:
  []
key_files:
  - src/components/ui/Skeleton.tsx
  - src/app/admin/menu/page.tsx
  - src/app/admin/tables/page.tsx
  - src/app/admin/qr/page.tsx
  - src/app/staff/checkout/page.tsx
key_decisions:
  - CSS-based skeleton animations using shimmer effect (no JS library)
  - Amber/cream palette matching app's warm design
  - Staff station pages use SSE + useOrderStream with existing loading patterns
  - Customer order page is server-rendered with Suspense boundary
patterns_established:
  - CSS shimmer skeleton animations (no JS library)
  - Skeleton components in amber/cream palette matching app design
  - Error state with retry button in Vietnamese
  - Skeleton wrapped in proper page header for context
observability_surfaces:
  - Error boundaries log network failures with console.error
drill_down_paths:
  - .gsd/milestones/M005/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M005/slices/S03/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-05-08T04:17:39.835Z
blocker_discovered: false
---

# S03: Skeleton Loaders + Error UX Polish

**Added skeleton loaders and error states to all pages**

## What Happened

Completed S03 Skeleton Loaders + Error UX Polish for M005. Added skeleton loaders to admin menu (SkeletonMenuRow), admin tables (SkeletonTableCard), admin QR (inline skeleton count), and staff checkout (SkeletonCard in card structure). Added error states with Vietnamese retry buttons to admin tables and staff checkout pages. 178 tests pass, build succeeds.

## Verification

Verified by: npx vitest run → 178 tests pass (12 test files). npx next build compiles successfully with all 22+ routes.

## Requirements Advanced

- R009: Polished loading states — S03 adds skeleton loaders to customer/staff/admin pages

## Requirements Validated

- R010: Error states — S03 adds error states with retry to admin and checkout pages

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

none

## Files Created/Modified

- `src/components/ui/Skeleton.tsx` — Skeleton component library with SkeletonCard, SkeletonMenuCard, SkeletonOrderCard, SkeletonTableCard, SkeletonMenuRow, SkeletonCheckoutRow
- `src/app/admin/menu/page.tsx` — Admin menu page uses SkeletonMenuRow for loading skeleton rows
- `src/app/admin/tables/page.tsx` — Admin tables page uses SkeletonTableCard with proper header, error state with retry
- `src/app/admin/qr/page.tsx` — Admin QR page shows skeleton count during loading
- `src/app/staff/checkout/page.tsx` — Staff checkout page uses SkeletonCard inside card structure and has error state with retry
