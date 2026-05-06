# S01: Bill & Payment Flow

**Goal:** Deliver the complete bill-to-payment lifecycle: schema migration, bill aggregation API, mark-paid API, checkout page with bill detail view, cancel from bill, payment confirmation, and SSE integration for payment events.
**Demo:** Staff opens '💰 Tính tiền' tab → sees tables with unpaid orders → taps a table → sees aggregated bill (items from multiple orders, cancelled items struck through) → cancels an item (two-tap) → total updates → taps 'Đã thanh toán' (two-tap) → all orders → PAID → table disappears from list → bar/kitchen stations clear paid orders via SSE.

## Must-Haves

- 1. paidAt DateTime? added to Order model, migration applied, build passes
- 2. GET /api/staff/tables/[tableId]/bill returns items from all unpaid orders with menu data and total
- 3. POST /api/staff/tables/[tableId]/pay sets all unpaid orders to PAID + paidAt + broadcasts SSE
- 4. Item PATCH rejects changes on PAID orders with 409
- 5. Staff orders GET excludes PAID from results
- 6. StaffNav shows 4th tab '💰 Tính tiền' at /staff/checkout
- 7. Checkout page lists tables with unpaid orders, shows table name + total
- 8. Bill detail aggregates items across orders, shows cancel buttons, total, payment button
- 9. Two-tap confirmation on both cancel and pay buttons
- 10. useOrderStream handles order-paid event → removes paid orders from station views
- 11. Unit tests pass for bill aggregation and PAID transition

## Proof Level

- This slice proves: E2E: 2 orders on same table → open bill → verify aggregation → cancel 1 item → verify total change → mark paid → verify SSE broadcast → verify stations cleared. Build: npx prisma generate && npx next build.

## Integration Closure

SSE order-paid event propagates to all connected station views. Staff orders API excludes PAID orders. New QR scan on paid table creates fresh order normally.

## Verification

- Console logs on mark-paid API (order IDs, paidAt timestamp). SSE broadcast log for order-paid events.

## Tasks

- [x] **T01: Schema migration + order-status guards + staff orders PAID exclusion** `est:30 min`
  1. Add `paidAt DateTime?` to Order model in prisma/schema.prisma
  2. Run prisma migrate dev to create migration
  3. Run prisma generate to update client
  4. Update staff orders GET route (src/app/api/staff/orders/route.ts): add 'PAID' to the notIn array so PAID orders are excluded from station views
  5. Update item PATCH route (src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts): add guard at the top — if order.status === 'PAID', return 409 with 'Đơn hàng đã thanh toán, không thể thay đổi.'
  6. Write unit tests in src/lib/__tests__/order-status-paid.test.ts:
     - Test that PAID is a valid OrderStatus value
     - Test that deriveOrderStatus does NOT return PAID (it's order-level, not item-derived)
     - Test that isValidTransition from any ItemStatus to any other status works as before (no PAID in ItemStatus)
  7. Verify: npx prisma generate && npx next build succeeds
  - Files: `prisma/schema.prisma`, `src/app/api/staff/orders/route.ts`, `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`, `src/lib/__tests__/order-status-paid.test.ts`
  - Verify: npx prisma generate && npx vitest run src/lib/__tests__/order-status-paid.test.ts && npx next build

- [x] **T02: Bill aggregation API + mark-paid API** `est:45 min`
  1. Create GET /api/staff/tables/[tableId]/bill (src/app/api/staff/tables/[tableId]/bill/route.ts):
     - Validate tableId is a valid integer
     - Query all orders for this table where status is NOT IN ['PAID', 'CANCELLED']
     - Include items with menuItem details (id, name, category, price) and table info
     - Compute aggregated total: sum of (price × quantity) for all non-CANCELLED items across all orders
     - Return: { table: { id, number, name }, orders: [...], items: [flat list with orderId], total: number }
     - If no unpaid orders found, return 404 with 'Bàn này không có đơn chưa thanh toán.'
  - Files: `src/app/api/staff/tables/[tableId]/bill/route.ts`, `src/app/api/staff/tables/[tableId]/pay/route.ts`
  - Verify: npx next build && manual curl test or automated test against running dev server

- [x] **T03: Checkout page UI — table list + bill detail + payment** `est:60 min`
  1. Add 4th tab to StaffNav (src/app/staff/StaffNav.tsx):
     - Add { href: '/staff/checkout', label: 'Tính tiền', emoji: '💰' } to NAV_ITEMS array
  - Files: `src/app/staff/StaffNav.tsx`, `src/app/staff/checkout/page.tsx`, `src/components/staff/BillView.tsx`, `src/app/api/staff/checkout/route.ts`
  - Verify: npx next build && open http://localhost:3000/staff/checkout in browser → verify tab visible, table list renders, bill detail works

- [x] **T04: SSE payment integration + useOrderStream extension + unit tests** `est:40 min`
  1. Extend useOrderStream (src/components/staff/useOrderStream.ts):
     - Add REMOVE_ORDERS action to reducer: removes orders by ID array
     - Add event listener for 'order-paid' SSE event
     - On order-paid: dispatch REMOVE_ORDERS with the paid orderIds → orders disappear from station views
  - Files: `src/components/staff/useOrderStream.ts`, `src/app/staff/checkout/page.tsx`, `src/components/staff/BillView.tsx`, `src/lib/__tests__/bill-aggregation.test.ts`
  - Verify: npx vitest run && npx next build

## Files Likely Touched

- prisma/schema.prisma
- src/app/api/staff/orders/route.ts
- src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts
- src/lib/__tests__/order-status-paid.test.ts
- src/app/api/staff/tables/[tableId]/bill/route.ts
- src/app/api/staff/tables/[tableId]/pay/route.ts
- src/app/staff/StaffNav.tsx
- src/app/staff/checkout/page.tsx
- src/components/staff/BillView.tsx
- src/app/api/staff/checkout/route.ts
- src/components/staff/useOrderStream.ts
- src/lib/__tests__/bill-aggregation.test.ts
