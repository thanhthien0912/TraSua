---
id: T01
parent: S01
milestone: M004
key_files:
  - prisma/schema.prisma
  - prisma/migrations/20260506071758_add_paid_at/migration.sql
  - src/app/api/staff/orders/route.ts
  - src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts
  - src/lib/__tests__/order-status-paid.test.ts
key_decisions:
  - PAID guard in item PATCH fetches order status with a separate lightweight query (select: { status: true }) before parsing the request body, ensuring early rejection without wasted parsing
duration: 
verification_result: passed
completed_at: 2026-05-06T07:20:10.957Z
blocker_discovered: false
---

# T01: Added paidAt column to Order, excluded PAID orders from staff station views, and guarded item PATCH against changes on PAID orders

**Added paidAt column to Order, excluded PAID orders from staff station views, and guarded item PATCH against changes on PAID orders**

## What Happened

Added `paidAt DateTime?` field to the Order model in prisma/schema.prisma and ran `prisma migrate dev --name add_paid_at` which created migration `20260506071758_add_paid_at`. Updated the staff orders GET route to add 'PAID' to the notIn exclusion array so paid orders no longer appear on bar/kitchen station views. Added a guard at the top of the item PATCH handler that fetches the parent order's status and returns 409 Conflict with message 'Đơn hàng đã thanh toán, không thể thay đổi.' if the order is PAID, preventing any item status changes on settled orders. Wrote 10 unit tests covering: PAID as a valid OrderStatus value, deriveOrderStatus never returning PAID (confirming it's an order-level override not item-derived), and all existing ItemStatus transitions remaining intact without PAID contamination.

## Verification

Ran `npx prisma generate` — succeeded, client regenerated. Ran `npx vitest run src/lib/__tests__/order-status-paid.test.ts` — 10/10 tests passed in 201ms. Ran `npx next build` — compiled successfully with no TypeScript errors, all 15 routes generated.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx prisma generate` | 0 | ✅ pass | 2000ms |
| 2 | `npx vitest run src/lib/__tests__/order-status-paid.test.ts` | 0 | ✅ pass — 10/10 tests | 201ms |
| 3 | `npx next build` | 0 | ✅ pass — compiled, TypeScript clean, 15 routes | 18100ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `prisma/schema.prisma`
- `prisma/migrations/20260506071758_add_paid_at/migration.sql`
- `src/app/api/staff/orders/route.ts`
- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`
- `src/lib/__tests__/order-status-paid.test.ts`
