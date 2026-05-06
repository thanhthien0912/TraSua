---
id: T01
parent: S02
milestone: M004
key_files:
  - src/app/api/staff/menu/route.ts
  - src/app/api/staff/orders/[orderId]/items/route.ts
  - src/lib/__tests__/add-item-api.test.ts
key_decisions:
  - Reuse 'item-status-change' SSE event type for add-item broadcasts — stations already handle this event, no new event type needed
  - Include derivedStatus in broadcast payload (matching existing PATCH endpoint pattern) for station client-side processing
  - Use $transaction wrapping createMany + recalculate + re-fetch to ensure atomic consistency
duration: 
verification_result: passed
completed_at: 2026-05-06T08:08:19.402Z
blocker_discovered: false
---

# T01: Created GET /api/staff/menu and POST /api/staff/orders/[orderId]/items endpoints with 14 unit tests for add-item validation

**Created GET /api/staff/menu and POST /api/staff/orders/[orderId]/items endpoints with 14 unit tests for add-item validation**

## What Happened

Built both API endpoints that power the add-item-from-bill feature:

**GET /api/staff/menu** — Returns all menu items sorted by sortOrder ascending with fields: id, name, price, category, available, sortOrder. Uses the same Prisma query pattern as the server-side fetch in the order page but exposed as a client-accessible API route. Includes console logging for observability.

**POST /api/staff/orders/[orderId]/items** — Full validation chain matching the existing POST /api/order pattern:
- Parse body: `{ items: [{ menuItemId, quantity, notes? }] }`
- Validates: body shape (400), quantity positivity (400), orderId existence (404), PAID guard (409), menuItem existence (400), availability (409 with unavailableItems array)
- Creates OrderItems via `prisma.orderItem.createMany` inside `prisma.$transaction`
- Recalculates totalAmount server-side using `calculateOrderTotal()` from order-status.ts
- Derives new order status using `deriveOrderStatus()` on all item statuses
- Re-fetches enriched order (with table, items, menuItem) for SSE broadcast
- Broadcasts `item-status-change` event — reuses existing event type that stations already handle
- Returns enriched order with status 201
- Vietnamese error messages consistent with existing endpoints

**Unit tests** — 14 new tests in `add-item-api.test.ts` covering:
- calculateOrderTotal with newly added PENDING items alongside existing items in various states
- Large VND values, all-cancelled + new items, single new item scenarios
- deriveOrderStatus after adding PENDING items to orders in various states (PREPARING, READY, SERVED, mixed)
- PAID guard logic: PAID rejection, non-PAID acceptance, deriveOrderStatus never returns PAID

## Verification

Ran `npx vitest run` — all 111 tests pass (97 existing + 14 new across 8 test files). Ran `npx next build` — TypeScript compilation succeeded, both new routes appear in the build output (`/api/staff/menu` and `/api/staff/orders/[orderId]/items`). No type errors.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run` | 0 | ✅ pass | 1861ms |
| 2 | `npx next build` | 0 | ✅ pass | 11284ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/app/api/staff/menu/route.ts`
- `src/app/api/staff/orders/[orderId]/items/route.ts`
- `src/lib/__tests__/add-item-api.test.ts`
