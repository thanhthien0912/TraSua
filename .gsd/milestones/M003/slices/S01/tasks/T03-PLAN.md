---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T03: PATCH item status endpoint + SSE broadcast on order creation

Create the write-path API and wire SSE broadcasting into both mutation points.

**Steps:**
1. Create `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts` — PATCH Route Handler. Parse `{status}` or `{action: 'cancel'}` from body. Validate item exists and belongs to order. Use `isValidTransition()` to check — return 409 Conflict with current status if invalid. Update item status via Prisma. After update, fetch all items for the order and call `deriveOrderStatus()`. If derived status differs from current order status, update the order too. Broadcast SSE event with type `item-status-change` containing the full updated order with items. Return updated order JSON.
2. Modify `src/app/api/order/route.ts` — After the successful Prisma transaction that creates the order, call `broadcast('new-order', orderData)` from the SSE registry. Import the broadcast function. The order data should include table info and all items with menuItem names.
3. Test: Create an order via POST, verify SSE stream receives it. PATCH an item status, verify SSE broadcasts the change. Try an invalid transition, verify 409 response.

## Inputs

- `src/lib/sse.ts — broadcast function`
- `src/lib/order-status.ts — deriveOrderStatus, isValidTransition`
- `src/lib/prisma.ts — PrismaClient`
- `src/app/api/order/route.ts — existing order creation endpoint`

## Expected Output

- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`
- `src/app/api/order/route.ts (modified)`

## Verification

Open SSE stream with curl -N, POST a new order via curl, verify SSE receives new-order event. PATCH item status, verify SSE receives item-status-change event. PATCH with invalid transition (e.g. READY→PENDING), verify 409 Conflict response.
