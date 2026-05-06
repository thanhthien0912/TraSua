---
id: T02
parent: S01
milestone: M003
key_files:
  - src/app/api/staff/orders/stream/route.ts
  - src/app/api/staff/orders/route.ts
key_decisions:
  - GET orders endpoint adds derivedStatus field computed from item statuses — gives the UI accurate order status even when the DB order.status hasn't been explicitly updated yet
  - Orders with no items after station filtering are excluded from results — prevents showing empty orders on station-specific views
duration: 
verification_result: passed
completed_at: 2026-05-06T05:36:52.181Z
blocker_discovered: false
---

# T02: SSE stream endpoint and GET orders endpoint with station-level filtering (bar/kitchen/all)

**SSE stream endpoint and GET orders endpoint with station-level filtering (bar/kitchen/all)**

## What Happened

Created two API Route Handlers that form the read path for the bar station UI.

**`src/app/api/staff/orders/stream/route.ts`** — GET handler returning `text/event-stream` via `ReadableStream`. On connection, the controller is registered in the SSE subscriber registry with the `?station` query param for filtered broadcasts. Sends an initial `:heartbeat` comment line to confirm the connection is open. Listens on `request.signal` abort to clean up the subscriber on disconnect. Sets all required headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.

**`src/app/api/staff/orders/route.ts`** — GET handler returning active orders (excludes SERVED and CANCELLED at order level). Accepts `?station=bar|kitchen|all` query param. When station=bar, includes only OrderItems where menuItem.category=DRINK. When station=kitchen, only FOOD. When station=all (default), includes everything. Each order includes table info, filtered items with menuItem details, and a `derivedStatus` computed from item statuses using `deriveOrderStatus()`. Orders with no items after filtering are excluded (e.g., a food-only order won't appear on bar station). Results sorted by createdAt desc.

Both endpoints include structured console logging with endpoint prefix for observability.

## Verification

1. TypeScript compilation: `npx tsc --noEmit` passed with zero errors.
2. Created a test order via POST /api/order with 1 DRINK item (Trà sữa trân châu) and 1 FOOD item (Bánh tráng trộn).
3. GET /api/staff/orders?station=bar returned 1 order with only the DRINK item — correct filtering.
4. GET /api/staff/orders?station=kitchen returned 1 order with only the FOOD item — correct filtering.
5. GET /api/staff/orders?station=all returned 1 order with both items — correct unfiltered response.
6. curl -N /api/staff/orders/stream returned `:heartbeat` and stayed open (killed by timeout after 5s, exit 124).
7. Response headers confirmed: Content-Type: text/event-stream, Cache-Control: no-cache, no-transform, Connection: keep-alive, X-Accel-Buffering: no.
8. SSE stream with ?station=bar also works correctly.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit --project tsconfig.json` | 0 | ✅ pass | 5200ms |
| 2 | `curl -s http://localhost:3000/api/staff/orders?station=bar (DRINK only)` | 0 | ✅ pass | 800ms |
| 3 | `curl -s http://localhost:3000/api/staff/orders?station=kitchen (FOOD only)` | 0 | ✅ pass | 500ms |
| 4 | `curl -s http://localhost:3000/api/staff/orders?station=all (both items)` | 0 | ✅ pass | 500ms |
| 5 | `timeout 5 curl -N -s http://localhost:3000/api/staff/orders/stream (SSE stays open)` | 124 | ✅ pass (timeout = connection stayed open) | 5000ms |
| 6 | `timeout 3 curl -N -s -D- http://localhost:3000/api/staff/orders/stream (header check)` | 124 | ✅ pass (correct SSE headers) | 3000ms |

## Deviations

Added derivedStatus field to GET orders response (not in plan but needed for accurate UI display). Also filter out orders with zero items after station filtering — without this, a food-only order would show up as an empty entry on the bar station.

## Known Issues

None.

## Files Created/Modified

- `src/app/api/staff/orders/stream/route.ts`
- `src/app/api/staff/orders/route.ts`
