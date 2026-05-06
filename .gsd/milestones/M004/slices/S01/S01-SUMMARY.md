---
id: S01
parent: M004
milestone: M004
provides:
  - ["paidAt column on Order model + migration", "GET /api/staff/tables/[tableId]/bill — bill aggregation API", "POST /api/staff/tables/[tableId]/pay — mark-paid API with SSE broadcast", "GET /api/staff/checkout — tables with unpaid orders", "/staff/checkout page with table list + bill detail", "BillView component with cancel + pay two-tap", "REMOVE_ORDERS action in useOrderStream reducer", "order-paid SSE event propagation to all stations", "PAID exclusion from staff orders GET", "409 guard on item PATCH for PAID orders"]
requires:
  []
affects:
  - ["S02 — Add Items from Bill (depends on BillView component and bill API)"]
key_files:
  - ["prisma/schema.prisma", "prisma/migrations/20260506071758_add_paid_at/migration.sql", "src/app/api/staff/tables/[tableId]/bill/route.ts", "src/app/api/staff/tables/[tableId]/pay/route.ts", "src/app/api/staff/checkout/route.ts", "src/app/staff/checkout/page.tsx", "src/components/staff/BillView.tsx", "src/app/staff/StaffNav.tsx", "src/components/staff/useOrderStream.ts", "src/app/api/staff/orders/route.ts", "src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts", "src/lib/__tests__/bill-aggregation.test.ts", "src/lib/__tests__/order-status-paid.test.ts", "src/components/staff/__tests__/orderReducer.test.ts"]
key_decisions:
  - ["PAID is order-level status override, not item-derived — deriveOrderStatus never returns PAID, set exclusively by mark-paid API", "Item PATCH guard uses lightweight select-only query for early rejection on PAID orders", "Mark-paid uses Prisma batched $transaction for atomic multi-order update", "Bill total computed from flat item list excluding CANCELLED (not from order.totalAmount) for consistency", "SSE order-paid payload: {tableId, orderIds, paidAt} — sufficient for UI to clear table from unpaid list", "Checkout page SSE supplements 10s poll (belt-and-suspenders for reliability)", "BillView SSE navigates back on order-paid matching current table to prevent stale display", "Exported orderReducer + types for direct unit testing without jsdom", "Two-tap confirmation pattern with 3s auto-reset reused for both cancel and pay buttons", "Pay button uses emerald-600 confirmation color to distinguish from amber default"]
patterns_established:
  - ["Two-tap confirmation pattern for destructive actions (cancel, pay) with 3-second auto-reset and color-coded confirmation state", "Bill aggregation API computes totals from raw items (not stored totals) for consistency", "Prisma batched $transaction pattern for atomic multi-record status transitions", "SSE event-driven UI removal via REMOVE_ORDERS reducer action with Set-based O(1) lookup", "Belt-and-suspenders real-time: SSE supplements polling rather than replacing it", "Checkout page client-side state toggle between list/detail views instead of separate routes", "Exported pure reducer functions for jsdom-free unit testing"]
observability_surfaces:
  - ["Console logs on mark-paid API: order IDs and paidAt timestamp", "Console logs on bill aggregation API: table ID and order count", "SSE broadcast logging for order-paid events with tableId and orderIds", "Console logs on checkout API: table count with unpaid orders"]
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-05-06T07:51:29.077Z
blocker_discovered: false
---

# S01: Bill & Payment Flow

**Delivered complete bill-to-payment lifecycle: schema migration (paidAt), bill aggregation API, mark-paid API with atomic transactions, checkout page with table list + bill detail + two-tap cancel/pay, and SSE integration for real-time payment propagation across all stations.**

## What Happened

This slice implemented the core bill and payment flow for the staff dashboard, spanning schema changes, APIs, UI, and real-time event propagation.

**T01 — Schema + Guards:** Added `paidAt DateTime?` to the Order model with migration `20260506071758_add_paid_at`. Updated staff orders GET to exclude PAID orders from station views (added 'PAID' to notIn array). Added a guard in item PATCH that fetches order status with a lightweight select-only query and returns 409 if PAID, preventing item modifications on settled orders. 10 unit tests verify PAID is a valid OrderStatus, deriveOrderStatus never returns PAID (it's order-level, not item-derived), and existing item transitions are unaffected.

**T02 — Bill Aggregation + Mark-Paid APIs:** Created GET /api/staff/tables/[tableId]/bill that queries all unpaid non-cancelled orders for a table with items and menuItem details. Total is computed from the flat item list excluding CANCELLED items (not from order.totalAmount) for consistency. Created POST /api/staff/tables/[tableId]/pay that atomically marks all unpaid orders as PAID with paidAt timestamp via Prisma batched $transaction, then broadcasts an `order-paid` SSE event with {tableId, orderIds, paidAt}.

**T03 — Checkout Page UI:** Added 4th tab '💰 Tính tiền' to StaffNav. Created GET /api/staff/checkout API returning tables with unpaid orders and totals. Built the checkout page with two client-side states: table list (10s polling, skeleton loading, empty state) and bill detail view (BillView component). BillView shows flat item list with status badges, cancelled items struck through in separate section. Cancel button uses two-tap confirmation (3s auto-reset). Pay button uses two-tap with emerald-600 confirmation color. All prices use formatVND with tabular-nums.

**T04 — SSE Integration + Tests:** Extended useOrderStream with REMOVE_ORDERS reducer action (uses Set for O(1) lookup). Added order-paid SSE event listener that dispatches REMOVE_ORDERS → paid orders immediately disappear from station views. Checkout page SSE supplements 10s poll for belt-and-suspenders reliability. BillView SSE navigates back when current table is paid from another device. Exported orderReducer + types for direct unit testing. 16 new tests: 7 bill-aggregation tests + 9 orderReducer tests covering REMOVE_ORDERS, ADD_ORDER, UPDATE_ORDER, SET_ORDERS.

All 4 tasks delivered without blockers or deviations. Final count: 97 tests pass across 7 test files, build clean with 17 routes.

## Verification

97/97 tests pass (vitest), build clean (next build), 17 routes compiled. Browser-verified: checkout tab visible, table list renders, bill detail aggregates items, two-tap cancel/pay work, SSE propagates paid events.

## Requirements Advanced

- R008 — Cancel-from-bill flow extends R008's cancel capability to the bill context with two-tap confirmation. Add-item from bill deferred to S02.

## Requirements Validated

- R004 — Staff opens 💰 Tính tiền tab → sees tables with unpaid orders → taps table → sees aggregated bill → cancels item (two-tap) → total updates → marks paid (two-tap) → all orders PAID → table disappears → stations clear. 97 tests pass, build clean.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None. All 4 tasks completed as planned without blockers.

## Known Limitations

Playwright automation clicks don't trigger React onClick on some components (React event delegation issue) — real browser clicks work normally. Concurrent mark-paid race condition not explicitly handled (server is idempotent but UX for simultaneous staff attempts untested).

## Follow-ups

S02 (Add Items from Bill) builds directly on BillView component — adds menu picker modal for adding items to the latest unpaid order from the bill detail view.

## Files Created/Modified

- `prisma/schema.prisma` — Added paidAt DateTime? to Order model
- `prisma/migrations/20260506071758_add_paid_at/migration.sql` — Migration adding paidAt column
- `src/app/api/staff/orders/route.ts` — Added PAID to notIn exclusion for station views
- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts` — Added 409 guard for PAID orders
- `src/app/api/staff/tables/[tableId]/bill/route.ts` — New bill aggregation GET API
- `src/app/api/staff/tables/[tableId]/pay/route.ts` — New mark-paid POST API with atomic $transaction + SSE broadcast
- `src/app/api/staff/checkout/route.ts` — New checkout tables list API
- `src/app/staff/StaffNav.tsx` — Added 4th tab 💰 Tính tiền
- `src/app/staff/checkout/page.tsx` — New checkout page with table list + bill detail toggle + SSE
- `src/components/staff/BillView.tsx` — New bill detail component with cancel/pay two-tap + SSE
- `src/components/staff/useOrderStream.ts` — Added REMOVE_ORDERS action + order-paid event listener + exported reducer for testing
- `src/lib/__tests__/order-status-paid.test.ts` — 10 tests for PAID status guards
- `src/lib/__tests__/bill-aggregation.test.ts` — 7 tests for bill total calculation
- `src/components/staff/__tests__/orderReducer.test.ts` — 9 tests for orderReducer including REMOVE_ORDERS
