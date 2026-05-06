---
estimated_steps: 10
estimated_files: 4
skills_used: []
---

# T01: Schema migration + order-status guards + staff orders PAID exclusion

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

## Inputs

- `prisma/schema.prisma (current Order model)`
- `src/app/api/staff/orders/route.ts (current GET with notIn)`
- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts (current PATCH)`

## Expected Output

- `prisma/migrations/*_add_paid_at/migration.sql`
- `src/lib/__tests__/order-status-paid.test.ts`
- `Updated staff orders route with PAID exclusion`
- `Updated item PATCH route with PAID guard`

## Verification

npx prisma generate && npx vitest run src/lib/__tests__/order-status-paid.test.ts && npx next build
