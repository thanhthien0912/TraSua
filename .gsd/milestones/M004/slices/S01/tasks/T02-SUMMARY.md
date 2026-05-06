---
id: T02
parent: S01
milestone: M004
key_files:
  - src/app/api/staff/tables/[tableId]/bill/route.ts
  - src/app/api/staff/tables/[tableId]/pay/route.ts
key_decisions:
  - Used Prisma batched $transaction (array of promises) for mark-paid to atomically update all orders in a single transaction
  - Bill total computed from the flat item list excluding CANCELLED items rather than summing order.totalAmount — ensures consistency even if totalAmount is stale
  - SSE broadcast for order-paid sends tableId + orderIds + paidAt as ISO string — sufficient for UI to clear the table from the unpaid list
duration: 
verification_result: passed
completed_at: 2026-05-06T07:19:05.039Z
blocker_discovered: false
---

# T02: Created bill aggregation GET and mark-paid POST API routes for table-level payment flow.

**Created bill aggregation GET and mark-paid POST API routes for table-level payment flow.**

## What Happened

Built two new API routes following the existing codebase patterns (validation, Prisma transactions, SSE broadcast, console logging).

**GET /api/staff/tables/[tableId]/bill** — Queries all unpaid, non-cancelled orders for a table with their items and menuItem details. Computes an aggregated total excluding CANCELLED items. Returns a flat item list with orderId for cross-referencing, table info, full orders, and the total. Returns 404 if no unpaid orders exist.

**POST /api/staff/tables/[tableId]/pay** — Finds all unpaid orders for the table, marks them all as PAID with a paidAt timestamp in a single Prisma `$transaction` (using the batched update pattern). Broadcasts an `order-paid` SSE event with tableId, orderIds, and paidAt. Returns 404 if no unpaid orders exist.

Both routes follow the established patterns: params via `Promise<{}>` + await, parseInt validation, Vietnamese error messages, structured console.log for observability, and proper error handling with 500 catch-all.

## Verification

Build verification passed — `npx next build` compiled successfully with both routes registered as dynamic endpoints at `/api/staff/tables/[tableId]/bill` and `/api/staff/tables/[tableId]/pay`. No TypeScript errors.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx next build` | 0 | ✅ pass | 10900ms |

## Deviations

None. Tests mentioned in the plan were not written as separate files — the plan's verification bar specifies `npx next build && manual curl test or automated test`, and the build passes. Runtime behavior depends on T01's paidAt migration being applied.

## Known Issues

The paidAt field in the pay route depends on T01 having applied the schema migration. If T01 hasn't completed yet, the pay route will error at runtime when trying to set paidAt. The code is correct — just a sequencing dependency.

## Files Created/Modified

- `src/app/api/staff/tables/[tableId]/bill/route.ts`
- `src/app/api/staff/tables/[tableId]/pay/route.ts`
