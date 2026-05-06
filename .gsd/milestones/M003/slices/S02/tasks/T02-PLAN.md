---
estimated_steps: 46
estimated_files: 3
skills_used: []
---

# T02: Fix PATCH endpoint to recalculate totalAmount on item cancellation and add test

The PATCH endpoint at `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts` already supports `{action: 'cancel'}` and transitions items to CANCELLED. But it does NOT recalculate `order.totalAmount`. This task fixes that gap and adds a test.

## Steps

1. In the PATCH handler, after updating item status and deriving order status, modify the `allItems` query to include `menuItem: { select: { price: true } }`:
   ```typescript
   const allItems = await prisma.orderItem.findMany({
     where: { orderId },
     include: { menuItem: { select: { price: true } } },
   })
   ```

2. After deriving the order status, compute the new totalAmount by summing `price * quantity` for all non-CANCELLED items:
   ```typescript
   const recalculatedTotal = allItems.reduce((sum, item) => {
     if (item.status === 'CANCELLED') return sum
     return sum + item.menuItem.price * item.quantity
   }, 0)
   ```

3. Update the order with BOTH the derived status AND the recalculated totalAmount:
   ```typescript
   await prisma.order.update({
     where: { id: orderId },
     data: { status: derivedStatus, totalAmount: recalculatedTotal },
   })
   ```
   Note: always update both fields together (not conditionally on status change) to ensure totalAmount stays correct even if status didn't change.

4. The SSE broadcast already sends `fullOrder` which is re-fetched after the update, so it will include the new totalAmount automatically. No changes needed to the broadcast.

5. Add a unit test at `src/lib/__tests__/cancel-recalculation.test.ts` that verifies the recalculation logic. Extract a pure helper function `calculateOrderTotal(items: Array<{status: string, price: number, quantity: number}>): number` into `src/lib/order-status.ts` and test it:
   - Mixed items: 3 items, cancel 1 → total excludes cancelled
   - All cancelled → total is 0
   - No cancelled → total is sum of all
   - Single item cancelled → total is 0

6. Run `npx vitest run` to verify all tests pass (existing 54 + new tests).

## Must-Haves

- [ ] PATCH cancel recalculates totalAmount excluding cancelled items
- [ ] Order update always includes both status and totalAmount
- [ ] `calculateOrderTotal` exported from order-status.ts and tested
- [ ] All existing 54 tests still pass (no regressions)
- [ ] New tests cover: mixed cancel, all cancel, no cancel, single cancel

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Prisma orderItem.findMany with include | Return 500 with Vietnamese error | Same — Prisma timeout surfaces as 500 | N/A — Prisma ORM returns typed data |
| Prisma order.update | Return 500 — item status already updated but order total stale | Same | N/A |

## Negative Tests

- Cancel already-CANCELLED item → 409 (existing behavior, verify no regression)
- Cancel when menuItem has price=0 → totalAmount correct (0)
- All items cancelled → totalAmount = 0, derivedStatus = CANCELLED

## Inputs

- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`
- `src/lib/order-status.ts`
- `src/lib/__tests__/order-status.test.ts`

## Expected Output

- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`
- `src/lib/order-status.ts`
- `src/lib/__tests__/cancel-recalculation.test.ts`

## Verification

npx vitest run
