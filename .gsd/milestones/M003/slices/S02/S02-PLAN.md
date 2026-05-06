# S02: Kitchen + Overview Stations + Item Cancellation

**Goal:** Mixed order (drink+food) → bar sees only drinks, kitchen sees only food items. Overview shows all orders with READY→SERVED transitions. Staff cancels an item → totalAmount recalculated server-side, SSE broadcasts change. Navigation tabs connect all three stations.
**Demo:** Mixed order (drink+food) → bar sees only drinks, kitchen sees only food items. Overview shows all orders. Staff cancels an item → totalAmount recalculated, SSE broadcasts change. Runner marks READY items as SERVED on overview.

## Must-Haves

- `/staff/kitchen` page renders and shows only FOOD items from SSE stream
- `/staff` overview page renders all orders with all status transitions including READY→SERVED
- Staff layout with navigation tabs (Quầy Bar / Bếp / Tổng quan) highlights active route
- PATCH cancel on an item → order.totalAmount recalculated excluding cancelled items
- Cancel all items → totalAmount is 0, derivedStatus is CANCELLED
- Cancel button in UI with two-tap confirmation (PENDING/PREPARING/READY items only)
- SSE broadcasts updated totalAmount after cancellation
- `npx tsc --noEmit` passes, `npx vitest run` passes (existing 54 + new tests)

## Proof Level

- This slice proves: Integration — real UI pages connected to real SSE streams and real API. TypeScript compilation + unit tests provide contract-level proof. Full runtime verification via dev server.

## Integration Closure

- Upstream: StationView, OrderCard, useOrderStream, PATCH endpoint, SSE registry, order-status module (all from S01)
- New wiring: kitchen page + overview page consume StationView; staff layout wraps all station pages with navigation; cancel button calls existing PATCH endpoint
- Remains for milestone: S03 adds notification chimes, auto-hide, and disconnection banner (purely additive polish)

## Verification

- Run the task and slice verification checks for this slice.

## Tasks

- [x] **T01: Create kitchen page, overview page, and staff layout with navigation tabs** `est:30m`
  Create the three new files that complete the station page topology: kitchen page, overview page, and a shared staff layout with navigation.
  - Files: `src/app/staff/kitchen/page.tsx`, `src/app/staff/page.tsx`, `src/app/staff/layout.tsx`
  - Verify: npx tsc --noEmit && test -f src/app/staff/kitchen/page.tsx && test -f src/app/staff/page.tsx && test -f src/app/staff/layout.tsx

- [x] **T02: Fix PATCH endpoint to recalculate totalAmount on item cancellation and add test** `est:45m`
  The PATCH endpoint at `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts` already supports `{action: 'cancel'}` and transitions items to CANCELLED. But it does NOT recalculate `order.totalAmount`. This task fixes that gap and adds a test.
  - Files: `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`, `src/lib/order-status.ts`, `src/lib/__tests__/cancel-recalculation.test.ts`
  - Verify: npx vitest run

- [x] **T03: Add cancel button with two-tap confirmation to OrderCard ItemRow** `est:30m`
  Add a cancel button to each item in OrderCard that allows staff to cancel items with a two-tap confirmation UX. This completes the cancel flow: T02 fixed the backend, this task adds the UI trigger.
  - Files: `src/components/staff/OrderCard.tsx`
  - Verify: npx tsc --noEmit && npx vitest run

## Files Likely Touched

- src/app/staff/kitchen/page.tsx
- src/app/staff/page.tsx
- src/app/staff/layout.tsx
- src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts
- src/lib/order-status.ts
- src/lib/__tests__/cancel-recalculation.test.ts
- src/components/staff/OrderCard.tsx
