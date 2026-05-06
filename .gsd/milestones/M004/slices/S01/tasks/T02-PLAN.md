---
estimated_steps: 19
estimated_files: 2
skills_used: []
---

# T02: Bill aggregation API + mark-paid API

1. Create GET /api/staff/tables/[tableId]/bill (src/app/api/staff/tables/[tableId]/bill/route.ts):
   - Validate tableId is a valid integer
   - Query all orders for this table where status is NOT IN ['PAID', 'CANCELLED']
   - Include items with menuItem details (id, name, category, price) and table info
   - Compute aggregated total: sum of (price × quantity) for all non-CANCELLED items across all orders
   - Return: { table: { id, number, name }, orders: [...], items: [flat list with orderId], total: number }
   - If no unpaid orders found, return 404 with 'Bàn này không có đơn chưa thanh toán.'

2. Create POST /api/staff/tables/[tableId]/pay (src/app/api/staff/tables/[tableId]/pay/route.ts):
   - Validate tableId
   - Find all orders for this table where status NOT IN ['PAID', 'CANCELLED']
   - If no unpaid orders, return 404
   - In a single Prisma transaction: update all unpaid orders to status='PAID', paidAt=new Date()
   - After transaction: broadcast SSE event 'order-paid' with { tableId, orderIds: [...], paidAt }
   - Return 200 with { paid: true, orderIds: [...], paidAt }

3. Write API tests verifying:
   - Bill aggregation returns correct data across multiple orders
   - Bill total excludes CANCELLED items
   - Mark-paid sets all orders to PAID with paidAt
   - Mark-paid on table with no unpaid orders returns 404

## Inputs

- `prisma/schema.prisma (Order model with paidAt)`
- `src/lib/sse.ts (broadcast function)`
- `src/lib/order-status.ts (calculateOrderTotal for reference)`
- `src/app/api/order/route.ts (validation pattern reference)`

## Expected Output

- `src/app/api/staff/tables/[tableId]/bill/route.ts`
- `src/app/api/staff/tables/[tableId]/pay/route.ts`

## Verification

npx next build && manual curl test or automated test against running dev server
