# S01: Bill & Payment Flow — UAT

**Milestone:** M004
**Written:** 2026-05-06T07:51:29.077Z

# UAT: S01 — Bill & Payment Flow

## UAT Type
Manual functional acceptance test. Covers the bill-to-payment lifecycle from the staff checkout tab through payment confirmation and SSE propagation to station views.

## Preconditions
- Dev server running at localhost:3000
- Database seeded with tables and menu items
- At least 2 orders placed on the same table (e.g., table 1) with mixed DRINK/FOOD items
- At least 1 item in CANCELLED status on one of the orders
- Bar station (/staff/bar) and kitchen station (/staff/kitchen) open in separate browser tabs

## Test Cases

### TC-01: Checkout Tab Navigation
1. Navigate to /staff/bar
2. **Expected:** Bottom nav shows 4 tabs: Quầy Bar, Bếp, Tính tiền, Tổng quan
3. Tap '💰 Tính tiền' tab
4. **Expected:** Navigates to /staff/checkout, tab highlighted as active

### TC-02: Table List with Unpaid Orders
1. Navigate to /staff/checkout
2. **Expected:** Table cards visible showing table name, order count (e.g., '2 đơn'), and VND total
3. **Expected:** Total on each card is computed from non-cancelled items only
4. **Expected:** Tables with only PAID orders do NOT appear in the list

### TC-03: Empty State
1. Mark all tables as paid (or use a fresh DB with no orders)
2. Navigate to /staff/checkout
3. **Expected:** Shows '🎉 Tất cả bàn đã thanh toán!' message

### TC-04: Bill Detail View — Aggregation
1. From table list, tap a table card (table with 2+ orders)
2. **Expected:** Bill detail opens with back button, table name, order/item counts
3. **Expected:** Items from ALL unpaid orders on that table displayed in a flat list
4. **Expected:** Each item shows name, quantity, price, status badge
5. **Expected:** Cancelled items shown in separate section with line-through styling and reduced opacity
6. **Expected:** Total at bottom excludes cancelled items, formatted as VND with tabular-nums

### TC-05: Cancel Item — Two-Tap Confirmation
1. On bill detail, tap cancel button (Huỷ) next to an active item
2. **Expected:** Button text changes to 'Xác nhận huỷ?' (confirmation state)
3. Wait 3+ seconds without tapping again
4. **Expected:** Button auto-resets back to original 'Huỷ' text
5. Tap cancel button again, then immediately tap 'Xác nhận huỷ?'
6. **Expected:** Item is cancelled, bill total updates, item moves to cancelled section

### TC-06: Mark Paid — Two-Tap Confirmation
1. On bill detail, tap 'Đã thanh toán' pay button
2. **Expected:** Button changes to 'Xác nhận thanh toán? ✓' with emerald/green styling
3. Wait 3+ seconds without tapping
4. **Expected:** Button auto-resets to original amber 'Đã thanh toán' state
5. Tap pay button again, then tap 'Xác nhận thanh toán? ✓'
6. **Expected:** Returns to table list, paid table no longer appears

### TC-07: PAID Orders Excluded from Station Views
1. Before paying, note orders visible on /staff/bar and /staff/kitchen for the target table
2. Mark table as paid via checkout (TC-06)
3. **Expected:** Orders for that table immediately disappear from bar and kitchen station views (SSE propagation)
4. Refresh /staff/bar and /staff/kitchen manually
5. **Expected:** Paid orders still not visible (server-side exclusion)

### TC-08: SSE Real-Time Update on Stations
1. Open /staff/bar in tab A, /staff/checkout in tab B
2. In tab B, pay a table that has drink items
3. **Expected:** In tab A (bar), the paid orders disappear without manual refresh (within ~1 second)

### TC-09: Item PATCH Rejection on PAID Orders
1. Mark a table as paid
2. Attempt to PATCH an item on one of the paid orders (via curl or API client):
   `PATCH /api/staff/orders/{orderId}/items/{itemId}` with `{"status": "PREPARING"}`
3. **Expected:** 409 response with message 'Đơn hàng đã thanh toán, không thể thay đổi.'

### TC-10: New Order on Previously Paid Table
1. Mark table 1 as paid via checkout
2. Scan QR for table 1 (navigate to /order?table=1)
3. Place a new order
4. **Expected:** New order succeeds, appears on station views
5. Navigate to /staff/checkout
6. **Expected:** Table 1 appears again with only the new unpaid order

### TC-11: Bill API — No Unpaid Orders
1. Mark all orders for table X as paid
2. Call GET /api/staff/tables/{X}/bill
3. **Expected:** 404 with 'Bàn này không có đơn chưa thanh toán.'

### TC-12: Checkout SSE — Multi-Device Sync
1. Open /staff/checkout → tap a table to see bill detail in browser A
2. In browser B, also navigate to /staff/checkout → pay the same table
3. **Expected:** Browser A's BillView navigates back to table list (paid table gone)

## Not Proven By This UAT
- **Add items from bill** — scoped to S02 (menu picker modal)
- **Performance under load** — not tested (single-user manual testing only)
- **SSE reconnection during payment** — disconnection/reconnection banners inherited from M003, not explicitly tested in checkout context
- **Concurrent payment race conditions** — two staff marking the same table paid simultaneously (server is idempotent but UX not tested)
- **Revenue reporting from paidAt** — schema supports it but explicitly out of scope for M004
- **Mobile viewport optimization of checkout page** — not explicitly tested at 375px breakpoint
