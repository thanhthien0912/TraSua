---
id: T03
parent: S01
milestone: M003
key_files:
  - src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts
  - src/app/api/order/route.ts
key_decisions:
  - PATCH broadcasts item-status-change to all stations (no station filter) — every station view needs to know about status changes to update its filtered display correctly
  - Order creation broadcast includes table info and full menuItem details (id, name, category, price) so station UIs can render and filter without additional API calls
  - Cancel action uses {action:'cancel'} body shape as alternative to {status:'CANCELLED'} — cleaner UX for staff-facing API
duration: 
verification_result: passed
completed_at: 2026-05-06T05:43:26.852Z
blocker_discovered: false
---

# T03: PATCH item status endpoint with forward-only transition validation, order status auto-derivation, and SSE broadcast on both order creation and item status changes

**PATCH item status endpoint with forward-only transition validation, order status auto-derivation, and SSE broadcast on both order creation and item status changes**

## What Happened

Created the write-path API endpoints that complete the real-time order pipeline.

**`src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`** — PATCH Route Handler for item status transitions. Accepts `{status}` or `{action: 'cancel'}` in the body. Validates the item exists and belongs to the specified order (404 if not). Uses `isValidTransition()` to enforce forward-only status changes — returns 409 Conflict with both `currentStatus` and `targetStatus` if the transition is invalid. After updating the item, fetches all order items and calls `deriveOrderStatus()` — if the derived status differs from the current order status, updates the order row too. Broadcasts an `item-status-change` SSE event with the full order (table, items, menuItem details, derivedStatus) to all subscribers. Returns the enriched order JSON.

**`src/app/api/order/route.ts` (modified)** — Added SSE broadcast after the successful Prisma transaction. Now includes `table` and full `menuItem` details (id, name, category, price) in the re-fetched order data so the broadcast payload is complete for station-filtered UI consumption. Broadcasts a `new-order` event to all SSE subscribers so new orders appear on station views in real time.

Both endpoints include structured console logging with endpoint prefix — transition attempts (valid and invalid), order status derivation changes, and broadcast events are all logged for observability.

## Verification

1. TypeScript compilation: `npx tsc --noEmit` — zero errors.
2. Unit tests: All 54 existing tests pass (vitest run).
3. SSE new-order broadcast: Started SSE stream with curl -N, POSTed a new order, confirmed the stream received `event: new-order` with full order data including table info and menuItem names within 2 seconds.
4. PATCH item status + SSE broadcast: PATCHed item from PENDING→PREPARING, confirmed 200 response with updated item/order status, confirmed SSE stream received `item-status-change` event with enriched order data including `derivedStatus: "PREPARING"`.
5. Invalid backward transition: PATCHed READY→PENDING, confirmed 409 Conflict with `{"currentStatus":"READY","targetStatus":"PENDING"}`.
6. Invalid skip-forward transition: PATCHed PENDING→READY, confirmed 409 Conflict.
7. Cancel action: PATCHed with `{"action":"cancel"}`, confirmed item and order both set to CANCELLED.
8. 404 for nonexistent item: PATCHed with invalid item ID, confirmed 404.
9. 400 for missing status/action: PATCHed with empty body fields, confirmed 400.
10. Server-side logging verified: SSE connection/disconnection, all transition attempts (valid and invalid), order status derivation changes visible in dev server output.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit --project tsconfig.json` | 0 | ✅ pass | 5000ms |
| 2 | `npx vitest run --reporter=verbose` | 0 | ✅ pass (54/54 tests) | 257ms |
| 3 | `curl -N SSE stream + POST /api/order → new-order event received` | 0 | ✅ pass | 4000ms |
| 4 | `curl PATCH /api/staff/orders/6/items/9 {status:PREPARING} → 200 + SSE item-status-change` | 0 | ✅ pass | 2000ms |
| 5 | `curl PATCH READY→PENDING → 409 Conflict` | 0 | ✅ pass | 500ms |
| 6 | `curl PATCH PENDING→READY → 409 Conflict` | 0 | ✅ pass | 500ms |
| 7 | `curl PATCH {action:cancel} → 200 CANCELLED` | 0 | ✅ pass | 500ms |
| 8 | `curl PATCH nonexistent item → 404` | 0 | ✅ pass | 500ms |
| 9 | `curl PATCH missing status/action → 400` | 0 | ✅ pass | 500ms |

## Deviations

Added table info and expanded menuItem fields (id, category) to the order creation response — the original endpoint only included name and price. This enrichment is needed for SSE consumers to properly filter by station.

## Known Issues

None.

## Files Created/Modified

- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`
- `src/app/api/order/route.ts`
