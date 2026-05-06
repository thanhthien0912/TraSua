# S01: Bar Station End-to-End (SSE + API + UI)

**Goal:** Prove SSE works in Next.js 16 and ship a complete, usable bar station with real-time order streaming, status transitions, and station-filtered display
**Demo:** Customer submits order containing drinks → /staff/bar page shows the drink items within 3 seconds via SSE → bar staff taps items through PENDING → PREPARING → READY, order status auto-derives correctly

## Must-Haves

- 1. GET /api/staff/orders?station=bar returns only DRINK items from active orders with correct order/item/table data
- 2. SSE endpoint at /api/staff/orders/stream stays open and delivers new-order events within 3 seconds of POST /api/order
- 3. PATCH /api/staff/orders/:orderId/items/:itemId advances item status and auto-derives order status per derivation rules
- 4. Invalid status transitions (e.g. READY→PENDING) return 409 Conflict
- 5. /staff/bar page renders order cards with table number, items, status badges, and action buttons
- 6. useOrderStream hook connects EventSource, handles initial snapshot + incremental SSE updates
- 7. SSE subscriber cleanup works on client disconnect (no memory leak)

## Proof Level

- This slice proves: Integration: POST order via curl → verify SSE delivers event to open /staff/bar page. Manual: open bar station in browser, submit order from customer page, see it appear in real-time, tap through statuses.

## Integration Closure

Modifies POST /api/order to broadcast SSE events. Creates new API surface under /api/staff/*. Creates new page routes under /staff/bar. Establishes SSE subscriber registry as shared infrastructure for S02.

## Verification

- Console logging for SSE connection/disconnection events. Server-side logging for status transition attempts (valid and invalid).

## Tasks

- [x] **T01: SSE subscriber registry + order status derivation** `est:30 min`
  Create the SSE infrastructure and status derivation logic that all subsequent tasks depend on.
  - Files: `src/lib/sse.ts`, `src/lib/order-status.ts`
  - Verify: Run unit tests for order-status derivation and transition validation. Verify sse.ts exports correct types and functions.

- [x] **T02: SSE stream endpoint + GET orders endpoint** `est:45 min`
  Create the two read-path API endpoints that the bar station UI will consume.
  - Files: `src/app/api/staff/orders/stream/route.ts`, `src/app/api/staff/orders/route.ts`
  - Verify: curl -N http://localhost:3000/api/staff/orders/stream returns text/event-stream that stays open. curl http://localhost:3000/api/staff/orders?station=bar returns JSON with only DRINK items. Dev server starts without errors.

- [x] **T03: PATCH item status endpoint + SSE broadcast on order creation** `est:45 min`
  Create the write-path API and wire SSE broadcasting into both mutation points.
  - Files: `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`, `src/app/api/order/route.ts`
  - Verify: Open SSE stream with curl -N, POST a new order via curl, verify SSE receives new-order event. PATCH item status, verify SSE receives item-status-change event. PATCH with invalid transition (e.g. READY→PENDING), verify 409 Conflict response.

- [x] **T04: useOrderStream hook + bar station page UI** `est:60 min`
  Build the client-side hook and the complete bar station page.
  - Files: `src/components/staff/useOrderStream.ts`, `src/components/staff/OrderCard.tsx`, `src/components/staff/StationView.tsx`, `src/app/staff/bar/page.tsx`
  - Verify: Dev server runs without errors. Navigate to /staff/bar — page renders with empty state or seed data. Submit order from /order page — new order appears on /staff/bar within 3 seconds via SSE. Tap status buttons — items advance through PENDING→PREPARING→READY.

## Files Likely Touched

- src/lib/sse.ts
- src/lib/order-status.ts
- src/app/api/staff/orders/stream/route.ts
- src/app/api/staff/orders/route.ts
- src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts
- src/app/api/order/route.ts
- src/components/staff/useOrderStream.ts
- src/components/staff/OrderCard.tsx
- src/components/staff/StationView.tsx
- src/app/staff/bar/page.tsx
