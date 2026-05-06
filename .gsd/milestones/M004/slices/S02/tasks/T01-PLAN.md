---
estimated_steps: 37
estimated_files: 3
skills_used: []
---

# T01: Create GET /api/staff/menu and POST /api/staff/orders/[orderId]/items endpoints with unit tests

Build both API endpoints that power the add-item-from-bill feature, plus unit tests for the add-item validation chain.

## Steps

1. Create `src/app/api/staff/menu/route.ts` — GET endpoint that returns all menu items from DB sorted by `sortOrder: 'asc'`. Return fields: id, name, price, category, available, sortOrder. Same Prisma query as the server-side fetch in `src/app/order/page.tsx` lines 34-35, but as a client-accessible API route.

2. Create `src/app/api/staff/orders/[orderId]/items/route.ts` — POST endpoint to add items to an existing order. Follow the exact validation chain from `src/app/api/order/route.ts`:
   - Parse body: `{ items: [{ menuItemId: number, quantity: number, notes?: string }] }`
   - Validate body shape: items array exists and is non-empty (400)
   - Validate each item: menuItemId is number, quantity is positive integer (400)
   - Validate orderId: fetch order with `select: { status: true }`, return 404 if not found
   - PAID guard: if `order.status === 'PAID'`, return 409 with message (same pattern as `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts` lines 45-63)
   - Validate menuItem existence: fetch by IDs, return 400 for missing (same as order route lines 67-79)
   - Validate availability: check `mi.available`, return 409 with unavailableItems array (same as order route lines 85-95)
   - Create OrderItems via `prisma.orderItem.createMany` inside `prisma.$transaction`
   - Recalculate totalAmount: re-fetch all order items, use `calculateOrderTotal()` from `src/lib/order-status.ts`, update order.totalAmount
   - Derive new order status: use `deriveOrderStatus()` on all item statuses, update order.status
   - Re-fetch full enriched order (with table, items, menuItem) for SSE broadcast
   - `broadcast('item-status-change', enrichedOrder)` — reuse existing event type, stations already handle it
   - Return enriched order with status 201

3. Create `src/lib/__tests__/add-item-api.test.ts` — Unit tests for the add-item endpoint validation logic. Since the project tests pure functions (not mocked API routes), extract the core validation into testable assertions:
   - Test that calculateOrderTotal correctly includes newly added items
   - Test that deriveOrderStatus returns correct status after adding PENDING items to an order with mixed statuses
   - Test PAID guard logic: order with status PAID should be rejected
   - Add at least 5 new tests covering the add-item scenarios

## Must-Haves

- [ ] GET /api/staff/menu returns all menu items sorted by sortOrder
- [ ] POST validates body shape, quantity, orderId existence, PAID guard, menuItem existence, availability
- [ ] POST creates OrderItems, recalculates totalAmount server-side, derives status
- [ ] POST broadcasts item-status-change SSE event with enriched order
- [ ] POST returns 201 with enriched order on success
- [ ] Console logs for observability on both endpoints
- [ ] New unit tests pass; existing 97 tests still pass
- [ ] Do NOT reuse CartProvider or any customer-facing cart logic

## Key constraints
- Import `broadcast` from `@/lib/sse` (same as order route)
- Import `calculateOrderTotal`, `deriveOrderStatus` from `@/lib/order-status`
- Import `prisma` from `@/lib/prisma`
- Vietnamese error messages consistent with existing endpoints
- All prices are Int (VND, no decimals) per MEM013

## Inputs

- ``src/app/api/order/route.ts` — validation chain pattern to replicate`
- ``src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts` — PAID guard pattern`
- ``src/lib/order-status.ts` — calculateOrderTotal and deriveOrderStatus imports`
- ``src/lib/sse.ts` — broadcast function import`
- ``src/app/order/page.tsx` — menu items Prisma query pattern (lines 34-35)`

## Expected Output

- ``src/app/api/staff/menu/route.ts` — new GET endpoint for menu items`
- ``src/app/api/staff/orders/[orderId]/items/route.ts` — new POST endpoint for adding items to order`
- ``src/lib/__tests__/add-item-api.test.ts` — unit tests for add-item validation scenarios`

## Verification

npx vitest run && npx next build
