---
verdict: pass
remediation_round: 0
---

# Milestone Validation: M004

## Success Criteria Checklist
- [x] **Staff opens '💰 Tính tiền' tab → sees all tables with unpaid orders → taps a table → sees aggregated bill across all orders** — `StaffNav.tsx` has 4th tab '💰 Tính tiền'. Checkout page (`/staff/checkout`) uses `GET /api/staff/checkout` to list tables with unpaid orders. BillView component fetches `GET /api/staff/tables/[tableId]/bill` to show aggregated bill. Code confirmed.
- [x] **Bill displays items with name, quantity, price, status; cancelled items shown with line-through and excluded from total** — `BillView.tsx` renders `BillItemRow` for each item with name, `×{quantity}`, `formatVND(price * quantity)`, status badge. `activeItems` and `cancelledItems` are separated by status filter. Cancelled items in separate section with `line-through` CSS class, `opacity-50`. Bill total from API excludes CANCELLED items.
- [x] **Cancel item from bill via two-tap confirmation → bill total updates → SSE broadcast to stations** — `BillItemRow` implements two-tap with `confirmingCancel` state, 3s auto-reset via `cancelTimerRef`. PATCH to `/api/staff/orders/[orderId]/items/[itemId]` with `{ action: 'cancel' }`. On success, `onCancelled` → `fetchBill()` refreshes total. SSE `item-status-change` event broadcast confirmed in item PATCH route.
- [x] **Mark paid via two-tap confirmation → all orders PAID with paidAt → SSE broadcast → stations clear → table disappears** — `BillView.tsx` `handlePayTap` two-tap with emerald-600 confirmation. POST to `/api/staff/tables/[tableId]/pay` uses `prisma.$transaction` to atomically update all unpaid orders with `status: 'PAID', paidAt`. SSE `order-paid` broadcast with `{tableId, orderIds, paidAt}`. `useOrderStream.ts` `REMOVE_ORDERS` action removes paid orders from station views. BillView SSE navigates back on `order-paid` for current table.
- [x] **Add item from bill via menu picker modal → item added to latest unpaid order → bill total updates → SSE broadcast** — `BillView.tsx` has '+ Thêm món' button opening `MenuPickerModal` with `orderId={bill.orders[bill.orders.length - 1].id}`. Modal fetches `GET /api/staff/menu`, shows DRINK/FOOD tabs. POST to `/api/staff/orders/[orderId]/items` creates items in `$transaction`, recalculates total, broadcasts `item-status-change` SSE. `onSuccess={fetchBill}` refreshes bill.
- [x] **New QR scan on paid table → new order works normally (filters to unpaid orders only)** — `GET /api/staff/orders` excludes `PAID` in `notIn` array (confirmed in route.ts line: `notIn: ['SERVED', 'CANCELLED', 'PAID']`). Bill API queries `status: { notIn: ['PAID', 'CANCELLED'] }`. New orders created normally — PAID orders invisible to all staff views.
- [x] **Unit tests pass for bill aggregation, PAID transition, PAID guard on item modifications** — 111 tests pass across 8 test files. Includes: `bill-aggregation.test.ts` (7 tests), `order-status-paid.test.ts` (10 tests for PAID guards), `orderReducer.test.ts` (9 tests including REMOVE_ORDERS), `add-item-api.test.ts` (14 tests for add-item + PAID guard). Build clean with 20 routes.

## Slice Delivery Audit
| Slice | SUMMARY.md | Verification Result | Tasks | Evidence |
|-------|-----------|-------------------|-------|----------|
| S01 — Bill & Payment Flow | ✅ Present | ✅ passed | 4/4 complete | 97 tests pass at slice completion, build clean 17 routes. Schema migration, bill aggregation API, mark-paid API, checkout page, BillView with cancel/pay, SSE integration all delivered. |
| S02 — Add Items from Bill | ✅ Present | ✅ passed | 2/2 complete | 111 tests pass (97 + 14 new), build clean 18 routes. Menu API, add-item API, MenuPickerModal with DRINK/FOOD tabs, BillView integration all delivered. |

**Outstanding follow-ups (non-blocking):**
- S01: Playwright automation click limitation (React event delegation) — real browser clicks work normally, no functional impact.
- S01: Concurrent mark-paid race condition — server is idempotent, UX for simultaneous staff untested. Low risk for single-shop deployment.
- S02: Single-item modal vs multi-item cart — deliberate simplicity choice, adequate for target use case.
- S02: No optimistic locking for concurrent bill edits — acceptable for local WiFi deployment with small staff count.
- S02: Menu data fetched fresh on each modal open — no caching, acceptable for local network latency.

## Cross-Slice Integration
## S01 → S02 Boundary Contracts

| Boundary | Producer (S01) Evidence | Consumer (S02) Evidence | Status |
|----------|------------------------|------------------------|--------|
| **BillView component** | S01 created `src/components/staff/BillView.tsx` with bill detail display, cancel two-tap, pay two-tap | S02 modified BillView to add '+ Thêm món' button (`setShowMenuPicker(true)`) and rendered `<MenuPickerModal>` with `onSuccess={fetchBill}` | ✅ Honored |
| **Bill aggregation API** | S01 created `GET /api/staff/tables/[tableId]/bill` returning `{table, orders, items, total}` | S02's MenuPickerModal receives `orderId={bill.orders[bill.orders.length - 1].id}` from BillView's bill data. On add-item success, `fetchBill()` re-calls this API to refresh totals | ✅ Honored |
| **SSE infrastructure** | S01 established `order-paid` SSE event type with `REMOVE_ORDERS` reducer action. Stations clear paid orders instantly. | S02 reused existing `item-status-change` SSE event type for add-item broadcasts. Stations already handle this event — no new event type needed. BillView SSE listener covers both patterns. | ✅ Honored |
| **Checkout tab infrastructure** | S01 created `/staff/checkout` page with table list, `GET /api/staff/checkout` API, StaffNav 4th tab | S02 operates within S01's checkout tab — MenuPickerModal opens from BillView within the checkout page. No new routes or nav changes needed. | ✅ Honored |

**Integration flow trace:** Staff opens 💰 Tính tiền tab (S01) → sees table list (S01) → taps table → BillView shows aggregated bill (S01) → taps '+ Thêm món' (S02 addition to S01 BillView) → MenuPickerModal opens with DRINK/FOOD tabs (S02) → selects item, submits → add-item API creates item + broadcasts SSE (S02) → fetchBill refreshes totals (calls S01's bill API) → cancel/pay still work (S01). **End-to-end flow integrates cleanly.**

**No boundary mismatches detected.**

## Requirement Coverage
## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **R004** — Tính tiền theo bàn (bill aggregation, total display, mark paid) | ✅ COVERED | S01 delivers complete bill-to-payment lifecycle: bill aggregation API computes totals from raw items excluding CANCELLED, mark-paid API with atomic `$transaction` sets paidAt on all unpaid orders, checkout page with table list + bill detail, two-tap cancel/pay, SSE propagation. 97 tests at S01 completion, 111 at milestone end. |
| **R008** — Huỷ món hoặc thêm món (cancel or add items from dashboard) | ✅ COVERED | **Cancel half:** M003/S02 delivered cancel with two-tap + SSE, extended to bill context in M004/S01's BillView. **Add-item half:** M004/S02 delivered `GET /api/staff/menu` + `POST /api/staff/orders/[orderId]/items` with full validation chain (body, quantity, orderId, PAID guard, menuItem existence, availability). MenuPickerModal with DRINK/FOOD tabs, quantity selector, 409 error handling. SSE reuses `item-status-change` event. 14 new unit tests. |
| **R001** — Customer QR ordering (regression check) | ✅ NO REGRESSION | PAID orders excluded via `notIn: ['SERVED', 'CANCELLED', 'PAID']` in staff orders GET. Customer-facing `/order` page and `/api/order` POST unchanged. New QR scans on paid tables create fresh orders normally. |
| **R002** — Station filtering bar/kitchen (regression check) | ✅ NO REGRESSION | Station filtering unchanged. `useOrderStream` filter logic intact. New `REMOVE_ORDERS` action and `order-paid` SSE listener added without modifying existing event handlers. Bar/kitchen routes confirmed in build output. |
| **R003** — Real-time staff dashboard with SSE (regression check) | ✅ NO REGRESSION | SSE infrastructure extended, not modified. `order-paid` event type added alongside existing `new-order` and `item-status-change`. `REMOVE_ORDERS` reducer action added to `useOrderStream` without changing existing `ADD_ORDER`/`UPDATE_ORDER` actions. 9 orderReducer tests cover all action types. |

**No requirements missing, regressed, or invalidated.**

## Verification Class Compliance
| Class | Planned Check | Evidence | Verdict |
|-------|--------------|----------|---------|
| **Contract** | Bill aggregation API returns correct totals; mark-paid API atomic transaction; add-item API validation chain | `bill-aggregation.test.ts` (7 tests) verifies total computation excluding CANCELLED items. `order-status-paid.test.ts` (10 tests) verifies PAID guards and transitions. `add-item-api.test.ts` (14 tests) verifies calculateOrderTotal with added items, deriveOrderStatus after adds, PAID guard logic. Mark-paid uses `prisma.$transaction` (confirmed in pay route). Add-item validation chain: body shape (400), quantity positivity (400), orderId (404), PAID guard (409), menuItem existence (400), availability (409). | ✅ Pass |
| **Integration** | SSE propagation (order-paid clears stations, item-status-change for added items); checkout page poll+SSE belt-and-suspenders | `useOrderStream.ts` handles `order-paid` via `REMOVE_ORDERS` (Set-based O(1) lookup), `item-status-change` via `UPDATE_ORDER`. `orderReducer.test.ts` (9 tests) verifies all reducer actions. BillView SSE navigates back on `order-paid` for current table. Checkout page combines 10s polling with SSE listeners. Add-item reuses `item-status-change` — stations need zero changes. | ✅ Pass |
| **Operational** | Console logging on all new APIs; SSE broadcast logging | Console logs confirmed: `[GET /api/staff/tables/${tableId}/bill]`, `[POST /api/staff/tables/${tableId}/pay]`, `[GET /api/staff/orders]`, `[BillView] Payment successful`, SSE broadcast logging in `broadcast()` function logs event name, station, send count, cleanup count. Add-item API logs orderId, item count, new totalAmount. | ✅ Pass |
| **UAT** | End-to-end checkout flow (table list → bill detail → cancel/pay → table disappears) | S01 SUMMARY confirms browser verification: checkout tab visible, table list renders, bill detail aggregates items, two-tap cancel/pay work, SSE propagates paid events. S02 SUMMARY confirms add-item flow with MenuPickerModal, DRINK/FOOD tabs, quantity selector, fetchBill refresh. 111 tests pass, build clean with 20 routes. | ✅ Pass |


## Verdict Rationale
All 7 success criteria satisfied with code-level evidence. Both slices have complete SUMMARY.md with verification_result: passed (S01: 4/4 tasks, S02: 2/2 tasks). All 4 S01→S02 boundary contracts honored — BillView component, bill aggregation API, SSE infrastructure, and checkout tab all integrate cleanly. R004 fully delivered (bill aggregation through payment), R008 fully delivered (cancel + add items). No regressions on R001-R003. 111/111 tests pass, build clean with 20 routes. All 4 verification classes (Contract, Integration, Operational, UAT) pass. Known limitations are non-blocking for the target single-shop local deployment.
