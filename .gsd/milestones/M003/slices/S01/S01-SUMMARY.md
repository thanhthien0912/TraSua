---
id: S01
parent: M003
milestone: M003
provides:
  - ["SSE subscriber registry (src/lib/sse.ts) — addSubscriber, removeSubscriber, broadcast, getSubscriberCount", "Order status derivation (src/lib/order-status.ts) — deriveOrderStatus, isValidTransition, getValidNextStatuses", "GET /api/staff/orders?station= — station-filtered active orders with derivedStatus", "GET /api/staff/orders/stream — SSE endpoint with station filtering", "PATCH /api/staff/orders/[orderId]/items/[itemId] — item status transitions + SSE broadcast", "POST /api/order now broadcasts new-order SSE event", "StationView reusable component for any station type", "OrderCard component with status badges and action buttons", "useOrderStream hook for real-time SSE consumption", "54 unit tests for order-status and SSE modules"]
requires:
  []
affects:
  - ["S02 — uses SSE registry, StationView component, all API endpoints", "S03 — uses SSE events for notifications, StationView for auto-hide"]
key_files:
  - ["src/lib/sse.ts", "src/lib/order-status.ts", "src/app/api/staff/orders/stream/route.ts", "src/app/api/staff/orders/route.ts", "src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts", "src/app/api/order/route.ts", "src/components/staff/useOrderStream.ts", "src/components/staff/OrderCard.tsx", "src/components/staff/StationView.tsx", "src/app/staff/bar/page.tsx", "src/lib/__tests__/order-status.test.ts", "src/lib/__tests__/sse.test.ts", "vitest.config.ts"]
key_decisions:
  - ["SSE subscriber registry on globalThis.__sseRegistry — HMR-safe singleton pattern matching Prisma", "Order status derived from item statuses via deriveOrderStatus() — computed on read/write, not stored separately", "SSE broadcasts to ALL stations without filter — client-side hook does station filtering", "StationView as reusable shared component — designed for S02 kitchen reuse", "Enriched SSE payloads include full menuItem details + table info to avoid extra API calls", "Vitest installed as test runner for unit testing infrastructure", "PATCH endpoint accepts both {status} and {action:'cancel'} body shapes"]
patterns_established:
  - ["SSE subscriber registry on globalThis with station-level filtering and dead subscriber cleanup", "Order status auto-derivation from item statuses — computed not stored", "Station-filtered API responses that exclude orders with zero items after filtering", "Forward-only item status transitions with 409 Conflict on invalid attempts", "Enriched SSE event payloads so clients avoid extra API roundtrips", "useOrderStream hook pattern: initial snapshot + incremental SSE updates with client-side filtering", "StationView + OrderCard reusable component pattern for station pages"]
observability_surfaces:
  - none
drill_down_paths:
  - [".gsd/milestones/M003/slices/S01/tasks/T01-SUMMARY.md", ".gsd/milestones/M003/slices/S01/tasks/T02-SUMMARY.md", ".gsd/milestones/M003/slices/S01/tasks/T03-SUMMARY.md", ".gsd/milestones/M003/slices/S01/tasks/T04-SUMMARY.md"]
duration: ""
verification_result: passed
completed_at: 2026-05-06T05:57:00.187Z
blocker_discovered: false
---

# S01: Bar Station End-to-End (SSE + API + UI)

**Delivered a complete real-time bar station — SSE infrastructure, staff API endpoints (GET orders, SSE stream, PATCH item status), and the /staff/bar page with live order streaming and one-tap status transitions.**

## What Happened

## What This Slice Built

This slice proves SSE works in Next.js 16 and ships a fully usable bar station with real-time order streaming, status transitions, and station-filtered display. It delivers the foundational real-time infrastructure that S02 (kitchen + overview) and S03 (notifications + polish) build upon.

### T01: SSE Infrastructure + Order Status Derivation
Created two foundational libraries:
- **`src/lib/sse.ts`** — In-memory SSE subscriber registry cached on `globalThis.__sseRegistry` (HMR-safe singleton pattern). Exports `addSubscriber()`, `removeSubscriber()`, `broadcast()`, `getSubscriberCount()`. Supports station-level filtering — bar clients only receive bar events. Dead subscribers auto-cleaned during broadcast.
- **`src/lib/order-status.ts`** — Pure functions: `deriveOrderStatus()` computes order status from item statuses, `isValidTransition()` enforces forward-only transitions (PENDING→PREPARING→READY→SERVED plus any→CANCELLED), `getValidNextStatuses()` returns valid next states for UI button rendering.
- Installed Vitest with 54 unit tests covering all derivation rules, transition validations, and SSE subscriber lifecycle.

### T02: Read-Path API Endpoints
- **GET `/api/staff/orders?station=bar|kitchen|all`** — Returns active orders with station-specific item filtering. Computes `derivedStatus` from item statuses. Excludes orders with zero items after filtering (e.g., food-only orders hidden from bar).
- **GET `/api/staff/orders/stream`** — SSE endpoint returning `text/event-stream` via `ReadableStream`. Registers subscriber with station filter. Sends heartbeat on connect. Cleans up subscriber on `request.signal` abort.

### T03: Write-Path API + SSE Broadcasting
- **PATCH `/api/staff/orders/[orderId]/items/[itemId]`** — Item status transitions with forward-only validation (409 Conflict on invalid transitions). Auto-derives and updates order status. Broadcasts `item-status-change` SSE event with full order data to all stations.
- **Modified POST `/api/order`** — Added SSE broadcast of `new-order` event with enriched payload (table info, full menuItem details) so station UIs can render and filter without additional API calls.

### T04: Client-Side Hook + Bar Station UI
- **`useOrderStream` hook** — Connects EventSource to SSE stream, loads initial snapshot from GET endpoint, processes `new-order` and `item-status-change` events. Client-side filtering by category (DRINK for bar) with re-derived order status from filtered items.
- **`OrderCard` component** — Renders order card with table number, item list with status badges, and action buttons driven by `getValidNextStatuses()`. Vietnamese labels throughout.
- **`StationView` component** — Reusable wrapper that filters out SERVED/CANCELLED orders, renders OrderCards, and provides empty-state messaging. Designed to be reused for kitchen station in S02.
- **`/staff/bar/page.tsx`** — Thin page wrapper passing station='bar' to StationView.

## Key Architectural Decisions
1. SSE subscriber registry on `globalThis.__sseRegistry` — same HMR-safe pattern as Prisma singleton
2. Order status derived (not stored) — `deriveOrderStatus()` computes on read and write, single source of truth
3. SSE broadcasts to ALL stations (no filter) — every station needs to see status changes to update its filtered display correctly; client-side hook does the filtering
4. StationView as reusable component — S02's kitchen station can reuse the same component with `station='kitchen'`
5. Enriched SSE payloads — new-order events include full menuItem details + table info so clients avoid extra API calls

## Verification Summary
- All 54 unit tests pass (Vitest) — order-status derivation, transition validation, SSE registry lifecycle
- TypeScript compiles cleanly (zero errors)
- SSE stream stays open (confirmed via curl -N, times out = success)
- Station filtering verified: bar returns only DRINK items, kitchen only FOOD, all returns both
- Item status PATCH: valid transitions return 200, invalid backward/skip transitions return 409
- SSE broadcasting: POST new order → SSE delivers new-order event; PATCH item status → SSE delivers item-status-change event
- /staff/bar page renders, connects to SSE, displays orders in real-time, tap-through statuses work


## Verification

**All 4 tasks verified passed:**
- T01: 54 unit tests pass (vitest run), TypeScript zero errors — SSE registry and order-status derivation fully covered
- T02: TypeScript compilation clean. curl verified: GET /api/staff/orders?station=bar returns only DRINK items, station=kitchen returns only FOOD items, station=all returns both. SSE stream stays open (timeout 5s = connection alive). Correct headers confirmed (text/event-stream, no-cache, keep-alive, X-Accel-Buffering: no).
- T03: TypeScript + 54 tests pass. SSE new-order broadcast confirmed (curl -N receives event within 2s of POST). PATCH PENDING→PREPARING returns 200 + SSE event. PATCH READY→PENDING returns 409. PATCH PENDING→READY returns 409. Cancel action works. 404 for nonexistent item. 400 for missing body fields.
- T04: Dev server runs without errors. /staff/bar page renders. SSE connection established. Order submission from /order page → order appears on /staff/bar within 3 seconds. Status buttons advance items PENDING→PREPARING→READY correctly.

**Slice-level cross-task integration:**
- All 10 planned files exist on disk
- All 4 task summaries present with verification_result: passed
- Full end-to-end flow verified: customer POST order → SSE broadcast → bar station shows order → staff taps through statuses → order status auto-derives correctly

## Requirements Advanced

- R002 — GET /api/staff/orders?station=bar returns only DRINK items, station=kitchen returns only FOOD items — automatic category-based routing is implemented and verified
- R003 — SSE delivers new orders to /staff/bar within 3 seconds of POST. Item status changes broadcast in real-time. No page refresh needed — dashboard updates automatically via EventSource.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

Added getValidNextStatuses() utility beyond plan (enables UI action buttons). Added getSubscriberCount() to SSE module for debugging. Added derivedStatus field to GET orders response (needed for accurate UI display). Enriched POST /api/order response with table info and full menuItem fields for SSE consumer needs. All deviations are additive — no plan items were removed or reduced.

## Known Limitations

No load testing — SSE verified with single-digit concurrent connections only. No cross-browser testing. Reconnection relies on EventSource built-in auto-reconnect without visual feedback (banner is S03 scope). SERVED transition not available from bar station — by design, that is runner/overview scope in S02.

## Follow-ups

S02 reuses StationView for kitchen station and builds overview page. S02 implements item cancellation with totalAmount recalculation. S03 adds notification chimes, auto-hide, and disconnection banner.

## Files Created/Modified

None.
