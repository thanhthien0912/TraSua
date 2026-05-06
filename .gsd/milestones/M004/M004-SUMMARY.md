---
id: M004
title: "Bill & Checkout"
status: complete
completed_at: 2026-05-06T08:33:34.023Z
key_decisions:
  - D011: PAID is order-level status override, not item-derived — deriveOrderStatus unchanged, PAID set exclusively by mark-paid API. Validated: clean separation maintained throughout.
  - D012: Add-item targets latest unpaid order (not new order) — kept order count manageable, bill aggregation handles it transparently.
  - D013: Two-slice decomposition (bill-payment first, add-item second) — enabled independent validation of core flow before adding UI complexity.
  - Bill total computed from raw items excluding CANCELLED (not from stored totalAmount) for consistency across multi-order aggregation.
  - SSE order-paid event reuses existing subscriber registry; add-item reuses item-status-change event type — zero client-side changes needed on stations.
  - Two-tap confirmation pattern with 3s auto-reset and color-coded states (amber default, emerald-600 for pay confirmation) — consistent destructive-action UX.
  - Belt-and-suspenders: SSE supplements 10s polling on checkout page rather than replacing it.
key_files:
  - prisma/schema.prisma — paidAt DateTime? on Order model
  - prisma/migrations/20260506071758_add_paid_at/migration.sql
  - src/app/api/staff/tables/[tableId]/bill/route.ts — bill aggregation API
  - src/app/api/staff/tables/[tableId]/pay/route.ts — mark-paid API with atomic $transaction + SSE
  - src/app/api/staff/checkout/route.ts — tables with unpaid orders API
  - src/app/api/staff/menu/route.ts — menu items endpoint for add-item modal
  - src/app/api/staff/orders/[orderId]/items/route.ts — add items to order API
  - src/app/staff/checkout/page.tsx — checkout page with table list + bill detail
  - src/components/staff/BillView.tsx — bill detail with cancel/pay/add-item
  - src/components/staff/MenuPickerModal.tsx — bottom-sheet menu picker
  - src/components/staff/useOrderStream.ts — REMOVE_ORDERS action + order-paid SSE
  - src/lib/__tests__/bill-aggregation.test.ts
  - src/lib/__tests__/order-status-paid.test.ts
  - src/lib/__tests__/add-item-api.test.ts
  - src/components/staff/__tests__/orderReducer.test.ts
lessons_learned:
  - Two-tap confirmation pattern proved versatile — reusable for any destructive staff action with color-coded confirmation states and auto-reset timer.
  - Reusing existing SSE event types (item-status-change) for new operations that produce compatible payloads eliminates client-side changes entirely.
  - Belt-and-suspenders (SSE + polling) is the right default for real-time staff UIs — SSE handles happy path, polling catches reconnection gaps.
  - Computing bill totals from raw items (not stored totalAmount) avoids consistency issues when aggregating across multiple orders.
  - Exported pure reducer functions enable jsdom-free unit testing of complex state logic.
  - Bottom-sheet modal pattern works well for mobile/tablet staff workflows — better thumb reach than centered dialogs.
---

# M004: Bill & Checkout

**Completed the order lifecycle with a staff checkout tab that aggregates bills per table, supports item cancellation and addition from the bill, and marks tables as paid with real-time SSE propagation across all stations.**

## What Happened

M004 delivered the bill and checkout flow — the missing piece that closes the order lifecycle from order → preparation → service → **payment**. The milestone was decomposed into two slices following the read-path-first pattern (D006 precedent): S01 built the core bill-to-payment lifecycle (schema, APIs, checkout page, cancel-from-bill, mark-paid, SSE), and S02 added the add-item capability via a bottom-sheet menu picker modal.

**S01: Bill & Payment Flow** — Added `paidAt DateTime?` to the Order model with migration. Built three new APIs: GET /api/staff/checkout (tables with unpaid orders), GET /api/staff/tables/[tableId]/bill (bill aggregation computing totals from raw items excluding CANCELLED), and POST /api/staff/tables/[tableId]/pay (atomic mark-paid via Prisma $transaction with SSE broadcast). Created the `/staff/checkout` page as the 4th tab in StaffNav ('💰 Tính tiền'), with client-side toggle between table list and bill detail (BillView component). BillView shows all items across orders, cancelled items struck through, two-tap confirmation for both cancel and pay actions. SSE integration via REMOVE_ORDERS reducer action clears paid orders from all station views instantly. Belt-and-suspenders pattern: SSE supplements 10s polling. PAID guard on item PATCH returns 409, and staff orders GET excludes PAID orders.

**S02: Add Items from Bill** — Created GET /api/staff/menu and POST /api/staff/orders/[orderId]/items endpoints. The add-item API wraps createMany + recalculate + re-fetch in a Prisma $transaction and reuses the existing `item-status-change` SSE event type (stations needed zero client changes). Built MenuPickerModal as a bottom-sheet with DRINK/FOOD tabs, availability badges, quantity selector, and 409 error handling. Integrated into BillView with '+ Thêm món' button.

**Cross-slice integration** was seamless — S02 consumed S01's BillView, bill API, and checkout infrastructure without modification. The SSE architecture from M003 extended naturally with the `order-paid` event type and `REMOVE_ORDERS` reducer action.

All 6 tasks across 2 slices completed without blockers or deviations. Final: 111 tests pass, build clean, 19 implementation files changed with +2,161 lines.

## Success Criteria Results

### Success Criteria Results

1. **Staff opens '💰 Tính tiền' tab → sees all tables with unpaid orders → taps a table → sees aggregated bill across all orders** — ✅ MET. StaffNav has 4th checkout tab, `/staff/checkout` page shows table list via GET /api/staff/checkout, tapping a table shows BillView with items aggregated from all unpaid orders via GET /api/staff/tables/[tableId]/bill.

2. **Bill displays items with name, quantity, price, status; cancelled items shown with line-through and excluded from total** — ✅ MET. BillView.tsx renders flat item list with status badges, cancelled items in separate section with line-through styling, total computed excluding CANCELLED items. Verified in bill-aggregation.test.ts (7 tests).

3. **Cancel item from bill via two-tap confirmation → bill total updates → SSE broadcast to stations** — ✅ MET. BillView cancel button uses two-tap confirmation with 3s auto-reset, calls existing item PATCH endpoint, bill total recalculates via fetchBill(), SSE broadcasts item-status-change to stations.

4. **Mark paid via two-tap confirmation → all table orders → PAID with paidAt → SSE broadcast → stations clear paid orders → table disappears from checkout list** — ✅ MET. Pay button with two-tap (emerald-600 confirmation), POST /api/staff/tables/[tableId]/pay atomically sets PAID+paidAt via $transaction, SSE broadcasts order-paid event, REMOVE_ORDERS reducer action clears orders from station views. Verified in order-status-paid.test.ts (10 tests) and orderReducer.test.ts (9 tests).

5. **Add item from bill via menu picker modal → item added to latest unpaid order → bill total updates → SSE broadcast to relevant station** — ✅ MET. MenuPickerModal with DRINK/FOOD tabs, POST /api/staff/orders/[orderId]/items creates items in latest unpaid order via $transaction, SSE reuses item-status-change event type. Verified in add-item-api.test.ts (14 tests).

6. **New QR scan on paid table → new order works normally (query filters to unpaid orders only)** — ✅ MET. Staff orders GET excludes PAID from results (notIn array includes 'PAID'). Bill aggregation queries only orders where paidAt IS NULL. New orders on previously-paid tables work normally.

7. **Unit tests pass for bill aggregation, PAID transition, PAID guard on item modifications** — ✅ MET. 111/111 tests pass: bill-aggregation (7), order-status-paid (10), orderReducer (9), add-item-api (14), plus 71 existing tests. Build clean.

## Definition of Done Results

### Definition of Done Results

- **All slices complete:** ✅ S01 [x] (4/4 tasks), S02 [x] (2/2 tasks) — both marked complete in DB
- **All slice summaries exist:** ✅ S01-SUMMARY.md and S02-SUMMARY.md present with full content
- **Cross-slice integration:** ✅ S02 consumed S01's BillView, bill API, and checkout infrastructure without issues. SSE architecture extended naturally.
- **Test suite passes:** ✅ 111/111 tests, 8 test files, 0 failures
- **Build succeeds:** ✅ `next build` compiles cleanly with all 18 routes
- **Key files verified:** ✅ All 19 implementation files present and functional
- **Requirements validated:** ✅ R004 (bill & checkout) and R008 (cancel + add items) both validated with evidence

## Requirement Outcomes

### Requirement Status Transitions

| Requirement | Previous Status | New Status | Evidence |
|---|---|---|---|
| R004 | active | **validated** | Staff opens 💰 Tính tiền → table list → bill detail → cancel item → pay → all orders PAID → SSE propagation. 97+ tests pass, build clean. Full bill lifecycle proven. |
| R008 | active | **validated** | Cancel: two-tap from station (M003) and bill (M004/S01). Add: MenuPickerModal + POST API adds items to latest unpaid order with SSE broadcast (M004/S02). Both halves delivered. 111 tests pass. |

**No requirements deferred, blocked, or invalidated.**

## Deviations

None. All 6 tasks across 2 slices completed exactly as planned without blockers or deviations.

## Follow-ups

- M005: Admin & Polish — menu management, settings, UI polish, print-ready QR sheets\n- Multi-item cart for batch adding from bill (currently single-item-at-a-time)\n- Concurrent mark-paid UX handling (server is idempotent but simultaneous staff taps untested)\n- Menu data caching in MenuPickerModal (currently fetches fresh on each open)\n- Revenue reporting using paidAt timestamps (schema supports it, explicitly out of scope for M004)
