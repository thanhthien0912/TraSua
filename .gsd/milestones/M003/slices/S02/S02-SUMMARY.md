---
id: S02
parent: M003
milestone: M003
provides:
  - ["Kitchen station page at /staff/kitchen filtering FOOD items", "Overview station page at /staff showing all orders with SERVED transitions", "Staff layout with bottom navigation connecting all three stations", "Item cancellation with totalAmount recalculation and SSE broadcast", "calculateOrderTotal helper function for server-side total computation"]
requires:
  - slice: S01
    provides: StationView, OrderCard, useOrderStream, PATCH endpoint, SSE registry, order-status module
affects:
  - ["S03"]
key_files:
  - ["src/app/staff/kitchen/page.tsx", "src/app/staff/page.tsx", "src/app/staff/layout.tsx", "src/app/staff/StaffNav.tsx", "src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts", "src/lib/order-status.ts", "src/lib/__tests__/cancel-recalculation.test.ts", "src/components/staff/OrderCard.tsx"]
key_decisions:
  - ["Bottom navigation over top tabs for better tablet/thumb ergonomics", "StaffNav extracted as Client Component to keep layout as Server Component", "PATCH endpoint unconditionally updates both status AND totalAmount to prevent stale totals", "Two-tap cancel confirmation with 3-second auto-reset timer", "CANCELLABLE_STATUSES as Set for O(1) lookup: PENDING, PREPARING, READY"]
patterns_established:
  - ["Thin Server Component page pattern — each station page wraps StationView with a station prop", "Staff bottom-nav layout with extracted Client Component for usePathname", "calculateOrderTotal pure helper for server-side total recalculation", "Two-tap confirmation UX for destructive actions with auto-reset timer"]
observability_surfaces:
  - ["SSE broadcast includes updated totalAmount after cancellation — observable in browser DevTools Network tab"]
drill_down_paths:
  - [".gsd/milestones/M003/slices/S02/tasks/T01-SUMMARY.md", ".gsd/milestones/M003/slices/S02/tasks/T02-SUMMARY.md", ".gsd/milestones/M003/slices/S02/tasks/T03-SUMMARY.md"]
duration: ""
verification_result: passed
completed_at: 2026-05-06T06:20:06.300Z
blocker_discovered: false
---

# S02: Kitchen + Overview Stations + Item Cancellation

**Kitchen station filters FOOD items, overview shows all orders with SERVED transitions, cancel button with two-tap confirmation recalculates totalAmount — completing the three-station staff dashboard topology**

## What Happened

This slice completed the staff dashboard station topology and added item cancellation with total recalculation.

**T01 — Station pages + navigation layout:** Created the kitchen page (`/staff/kitchen`) wrapping StationView with `station="kitchen"`, the overview page (`/staff`) with `station="all"`, and a shared staff layout with bottom-fixed navigation. The nav was extracted into a separate `StaffNav` client component to keep the layout as a Server Component. Three Vietnamese-labeled tabs (Quầy Bar / Bếp / Tổng quan) with amber active indicator pill. Overview uses exact-match (`pathname === '/staff'`) to avoid false active state on nested routes. Touch targets exceed 44px minimum.

**T02 — Cancel recalculation backend:** The PATCH endpoint already supported `{action: 'cancel'}` but did not recalculate `totalAmount`. Added a pure `calculateOrderTotal` helper to `order-status.ts` that sums `price * quantity` for non-CANCELLED items. The endpoint now always updates both `status` AND `totalAmount` unconditionally (not gated on status change) to prevent stale totals. SSE broadcast automatically includes the new total since it re-fetches the full order. 8 unit tests added covering all edge cases (mixed cancel, all cancelled, quantity>1, price=0, etc.).

**T03 — Cancel button UI:** Added two-tap cancel confirmation to `ItemRow` in OrderCard. First tap shows 'Xác nhận huỷ?' in solid red, second tap sends `PATCH {action: 'cancel'}`. 3-second auto-reset timer managed via `useEffect`+`useRef`. Only shown for CANCELLABLE_STATUSES (PENDING, PREPARING, READY). Loading spinner shared with advance buttons prevents double-submission.

All three station pages now share the same reusable StationView + OrderCard + useOrderStream architecture from S01, with station-level filtering handled by the `station` prop. The staff layout provides unified navigation across all stations.

## Verification

**TypeScript:** `npx tsc --noEmit` passes cleanly (exit 0). Note: stale `.next/dev/types/` auto-generated files had to be deleted first — these go stale when pages are added without the dev server running.

**Tests:** `npx vitest run` — 62 tests pass across 3 test files (cancel-recalculation: 8, order-status: 43, SSE: 11), zero failures.

**Files:** All 8 expected files verified present: kitchen/page.tsx, staff/page.tsx, staff/layout.tsx, StaffNav.tsx, PATCH route.ts, order-status.ts, cancel-recalculation.test.ts, OrderCard.tsx.

## Requirements Advanced

- R002 — Kitchen station filters FOOD items, bar filters DRINK items — station routing now fully implemented
- R003 — All three station pages (bar, kitchen, overview) display orders in real-time via SSE with status transitions
- R008 — Staff can cancel items from dashboard — totalAmount recalculated, SSE broadcasts change. Add-item capability still pending.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

StaffNav was extracted into its own client component file instead of being inline in layout.tsx as originally planned — this kept the layout as a Server Component (better Next.js practice). Minor structural improvement, not a functional deviation.

## Known Limitations

- Item cancellation is staff-only (no customer self-cancel) per D003 architectural decision
- 'Add item to existing order' (second half of R008) not yet implemented — only cancel is delivered
- No notification chime or auto-hide for completed items — deferred to S03

## Follow-ups

- S03 adds notification chimes, auto-hide, and disconnection banner (purely additive polish)
- R008 'add item' capability needs a future slice (not in current M003 roadmap)
- Verification commands in task plans should use cross-platform alternatives to `test -f` for Windows compatibility

## Files Created/Modified

- `src/app/staff/kitchen/page.tsx` — New — Kitchen station page wrapping StationView with station='kitchen'
- `src/app/staff/page.tsx` — New — Overview station page wrapping StationView with station='all'
- `src/app/staff/layout.tsx` — New — Staff layout with bottom padding for fixed nav
- `src/app/staff/StaffNav.tsx` — New — Client component with 3-tab bottom navigation using usePathname
- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts` — Modified — PATCH now recalculates totalAmount on cancel via calculateOrderTotal
- `src/lib/order-status.ts` — Modified — Added calculateOrderTotal pure helper function
- `src/lib/__tests__/cancel-recalculation.test.ts` — New — 8 unit tests for calculateOrderTotal edge cases
- `src/components/staff/OrderCard.tsx` — Modified — Added cancel button with two-tap confirmation to ItemRow
