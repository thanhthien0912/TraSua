# M003 — Staff Dashboard — Research

**Date:** 2025-07-17
**Status:** Complete

## Summary

M003 builds the real-time staff order management dashboard — the critical missing piece that connects customer orders (M002) to the physical bar/kitchen workflow. The existing codebase is exceptionally well-prepared for this: the Prisma schema already has `ItemStatus` per OrderItem, `Category` (DRINK/FOOD) per MenuItem for station routing, and `OrderStatus` for derived aggregation. The order creation endpoint (`POST /api/order`) establishes the pattern for new API routes. The middleware explicitly only protects `/admin/*`, so `/staff/*` routes are open by design.

The primary technical novelty is **Server-Sent Events (SSE)** via Next.js 16 Route Handlers. Next.js 16.2.4 supports `ReadableStream` responses from Route Handlers, which is the mechanism for SSE. The SSE endpoint returns a `text/event-stream` response with a never-closing ReadableStream. The key implementation challenge is the **in-memory subscriber registry** — a global Map of connected SSE clients that order mutation endpoints broadcast to after DB writes. This must handle connection cleanup on client disconnect and survive HMR reloads in development via the same `globalThis` caching pattern used by Prisma.

The build order should be: (1) API layer first — GET orders, PATCH item status, SSE stream endpoint, cancel endpoint — because these are the foundation and are independently testable. (2) SSE subscriber registry as the real-time backbone. (3) Station pages consuming the APIs. (4) Notification/UX polish (sound, auto-hide) last. The highest-risk slice is SSE connection lifecycle management; everything else uses established Next.js patterns already proven in M001/M002.

## Recommendation

**Approach: API-first, then UI.** Build and test the entire API surface (REST + SSE) before touching any React components. This lets us validate the hardest technical risk (SSE long-lived connections in Next.js Route Handlers) in isolation with curl/httpie before introducing UI complexity.

**SSE pattern:** Use a `ReadableStream` in a GET Route Handler at `/api/staff/orders/stream`. The stream stays open indefinitely. An in-memory `Set<ReadableStreamDefaultController>` (the subscriber registry) is stored on `globalThis` (same pattern as the Prisma singleton). When any mutation endpoint writes to the DB, it also iterates the subscriber set and `controller.enqueue()` the SSE event to all connected clients. On client disconnect (the `request.signal` abort event), the controller is removed from the set.

**Station filtering:** Rather than three separate API endpoints, use a single `GET /api/staff/orders` with a `?station=bar|kitchen|all` query parameter. The SSE stream similarly accepts a `?station=` param so each station only receives events for items it cares about (reduces noise). Station pages are thin wrappers: Server Component loads initial data, Client Component subscribes to SSE.

**Status derivation:** Compute order-level status server-side in the PATCH handler after updating item status. The derivation rules from M003-CONTEXT.md map cleanly to a pure function. SSE broadcasts the updated order status alongside the item status change.

## Implementation Landscape

### Key Files

**Existing (read/reuse):**
- `prisma/schema.prisma` — Order, OrderItem, MenuItem, Table models. `ItemStatus` enum (PENDING/PREPARING/READY/SERVED/CANCELLED), `OrderStatus` enum, `Category` enum (DRINK/FOOD). Schema is complete — no migrations needed.
- `src/lib/prisma.ts` — PrismaClient singleton via `globalThis`. Pattern to replicate for SSE subscriber registry.
- `src/lib/format.ts` — `formatVND()` utility. Reuse in staff dashboard for price display.
- `src/app/api/order/route.ts` — POST endpoint with Prisma transactions, validation, error handling. Pattern for new endpoints. **This file also needs modification** to broadcast SSE events after order creation.
- `src/middleware.ts` — Protects `/admin/*` only. `matcher: ["/admin/:path*", "/api/admin/:path*"]`. Staff routes are explicitly unprotected — no changes needed.
- `src/app/layout.tsx` — Root layout with `lang="vi"`. Staff pages inherit this.
- `src/app/globals.css` — Tailwind v4 import, amber theme CSS variables, system-ui font stack.
- `src/components/order/MenuView.tsx` — Reference for component patterns: `SerializedMenuItem` type, tab navigation, card layout.
- `src/components/order/CartProvider.tsx` — Reference for context + reducer pattern. Could inspire a `StaffOrdersProvider` if needed, but SSE may be simpler with a custom hook.

**New files to create:**
- `src/lib/sse.ts` — SSE subscriber registry (in-memory Set of controllers, broadcast function, cleanup helpers). The core real-time infrastructure.
- `src/app/api/staff/orders/route.ts` — GET endpoint returning active orders (filtered by station param).
- `src/app/api/staff/orders/stream/route.ts` — SSE endpoint returning `text/event-stream` ReadableStream.
- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts` — PATCH endpoint for item status transitions + item cancellation.
- `src/app/staff/page.tsx` — Overview station (Server Component shell).
- `src/app/staff/bar/page.tsx` — Bar station page.
- `src/app/staff/kitchen/page.tsx` — Kitchen station page.
- `src/app/staff/layout.tsx` — Shared staff layout (navigation between stations, notification toggle).
- `src/components/staff/OrderCard.tsx` — Individual order card with item list and status controls.
- `src/components/staff/StationView.tsx` — Shared station view component (parameterized by station type).
- `src/components/staff/useOrderStream.ts` — Custom hook wrapping EventSource + initial fetch + state management.
- `src/components/staff/NotificationProvider.tsx` — Audio notification management with mute toggle and autoplay unlock.
- `src/lib/order-status.ts` — Pure function for deriving order status from item statuses. Used server-side in PATCH handler and optionally client-side for optimistic updates.

### Build Order

**Phase 1: SSE Infrastructure + API (highest risk, unblocks everything)**
1. `src/lib/sse.ts` — Subscriber registry with globalThis caching
2. `src/lib/order-status.ts` — Status derivation pure function
3. `src/app/api/staff/orders/stream/route.ts` — SSE endpoint
4. `src/app/api/staff/orders/route.ts` — GET active orders
5. `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts` — PATCH status + cancel
6. Modify `src/app/api/order/route.ts` — Add SSE broadcast after order creation

**Why first:** SSE is the only genuinely new technology in this milestone. Validating that long-lived ReadableStream connections work correctly in Next.js 16 Route Handlers — including cleanup on disconnect, broadcasting to multiple clients, and surviving HMR — retires the biggest technical risk. All API endpoints are testable with curl before any UI exists.

**Phase 2: Staff Dashboard UI (established patterns)**
7. `src/app/staff/layout.tsx` — Shared layout with station navigation
8. `src/components/staff/useOrderStream.ts` — EventSource hook
9. `src/components/staff/OrderCard.tsx` — Order card component
10. `src/components/staff/StationView.tsx` — Parameterized station view
11. Station pages: `/staff`, `/staff/bar`, `/staff/kitchen`

**Why second:** UI is standard React/Next.js work following patterns established in M002. Lower risk, higher volume.

**Phase 3: Polish + Notifications**
12. `src/components/staff/NotificationProvider.tsx` — Sound + visual flash
13. Auto-hide completed items (5-minute timer)
14. Reconnection UX (banner, manual refresh fallback)

**Why last:** These are enhancements on a working foundation. Can be cut or simplified without breaking core functionality.

### Verification Approach

**API-level verification (Phase 1):**
- `curl http://localhost:3000/api/staff/orders?station=bar` → returns only DRINK items from active orders
- `curl -N http://localhost:3000/api/staff/orders/stream` → stays open, receives SSE events when orders are created via POST
- `curl -X PATCH http://localhost:3000/api/staff/orders/1/items/1 -d '{"status":"PREPARING"}'` → 200 + auto-derived order status
- `curl -X PATCH http://localhost:3000/api/staff/orders/1/items/1 -d '{"status":"PENDING"}'` (invalid reverse transition) → 409 Conflict
- `curl -X PATCH http://localhost:3000/api/staff/orders/1/items/1 -d '{"status":"CANCELLED"}'` → 200 + recalculated totalAmount
- Integration test: POST order → verify SSE stream receives the event within 3 seconds

**UI-level verification (Phase 2):**
- Open `/staff/bar` in one tab, `/staff/kitchen` in another → create order with mixed items → bar sees only drinks, kitchen sees only food
- Tap item status through PENDING → PREPARING → READY → verify order status auto-derives
- Open `/staff` overview → verify it shows all orders with aggregated status

**E2E verification (Phase 3):**
- Full loop: customer submits order → bar/kitchen stations show it via SSE → staff advances items → overview shows READY → runner marks SERVED
- Cancel item → verify totalAmount recalculated, SSE broadcasts change

## Constraints

- **Next.js 16.2.4 App Router** — SSE must use Route Handlers returning `ReadableStream`, not Pages API `res.write()`. The documented streaming pattern uses `new Response(stream)` with appropriate headers.
- **SQLite via better-sqlite3** — Synchronous driver under the hood. No pub/sub or LISTEN/NOTIFY like Postgres. SSE broadcast must be in-memory only.
- **No external dependencies** — R006 constraint. No Socket.io, no Redis, no external pub/sub. Everything in-process.
- **Prisma Client singleton** — All DB access through `src/lib/prisma.ts`. New queries must use the same import.
- **Tailwind v4** — CSS uses `@import "tailwindcss"` syntax, `@theme inline` for custom properties. No `tailwind.config.js`.
- **React 19.2.4** — `<Context>` uses the value prop directly (not `<Context.Provider value={...}>`), as seen in `CartProvider.tsx`.

## Common Pitfalls

- **SSE connection not staying open** — Next.js may try to close the response. The key is returning a `ReadableStream` that never calls `controller.close()` and setting `Content-Type: text/event-stream` + `Cache-Control: no-cache` + `Connection: keep-alive` headers. Also set `X-Accel-Buffering: no` to prevent nginx-style proxy buffering on local network.
- **HMR killing SSE connections in dev** — Hot module replacement restarts the server module, destroying the globalThis subscriber registry. Mitigation: same `globalThis` pattern as Prisma, and the client's `EventSource` auto-reconnects natively. On reconnect, client refetches full snapshot.
- **Memory leaks from orphaned SSE controllers** — Must listen for `request.signal` abort event to remove controllers from the registry when clients disconnect. Without this, the Set grows indefinitely.
- **Browser audio autoplay policy** — Modern browsers block `Audio.play()` without a user gesture. The notification provider needs an explicit "Bật thông báo" button that calls `audioContext.resume()` or plays a silent audio to unlock the context. This is a first-visit-only requirement.
- **SSE `data` field must be single-line** — Multi-line JSON in SSE `data:` field must be sent as a single line or split across multiple `data:` lines. Safest: `JSON.stringify()` always produces single-line output.
- **Concurrent PATCH race conditions** — Two stations tapping the same item simultaneously. The server must read current status from DB, validate the transition, then update. This is naturally serialized by SQLite's write lock, but the PATCH handler should still check the transition is valid before writing.
- **`EventSource` only supports GET** — Cannot send POST data via EventSource. Station filtering must use query params on the SSE URL, not request body.

## Open Risks

- **SSE connection lifecycle in Next.js production mode** — Validated streaming patterns in docs use finite streams. A truly infinite SSE stream (never closes) in a Route Handler is less documented. The `request.signal` abort mechanism for detecting client disconnect needs verification in Next.js 16 production build. Retire this risk in the first slice by building a minimal SSE proof-of-concept.
- **Multiple browser tabs from same device** — If a barista opens `/staff/bar` in two tabs, both get SSE streams. This is fine (no conflict), but worth noting for the subscriber count.
- **SQLite WAL mode under concurrent writes** — Multiple stations updating item statuses simultaneously. better-sqlite3 uses WAL mode by default, which handles concurrent reads + serialized writes well. At bubble tea shop scale (single-digit concurrent writes), this is a non-issue, but a BUSY timeout should be configured just in case.

## Requirements Analysis

### Table Stakes (M003 must deliver)
- **R001** (second half) — Staff receives orders. M003 completes this by showing orders on the dashboard via SSE.
- **R002** — Station routing (bar sees DRINK, kitchen sees FOOD). Direct Category enum mapping.
- **R003** — Real-time dashboard with <3 second updates via SSE.
- **R008** (partial) — Item cancellation from dashboard. Adding items deferred to M005 per architectural decision.

### Requirement Gaps / Candidates
- **Missing: Staff dashboard responsive layout requirement** — R007 covers customer UI mobile-first, but there's no equivalent for the staff dashboard's tablet/desktop optimization. The M003-CONTEXT specifies "tablet/desktop-optimized responsive layout" but this isn't captured as a requirement. **Candidate requirement:** Staff dashboard hiển thị tốt trên tablet (768px+) và desktop, tối ưu cho thao tác nhanh bằng ngón tay.
- **Missing: Notification/alert requirement** — The M003 context specifies sound notification + visual flash, but no requirement captures "Staff phải được thông báo khi có đơn mới." This is implied by R003 but could be explicit. **Advisory only** — covered by R003's spirit.
- **R008 partial scope** — The requirement says "huỷ món hoặc thêm món" but M003 only delivers cancellation. The "thêm món" half is deferred to M005. The requirement should be annotated to reflect this partial fulfillment after M003 completes.

### Out of Scope Confirmation
- R004 (billing) — M004 scope, not M003
- R005 (QR generation) — M001, already delivered
- R006 (local-only) — Constraint that M003 respects (no external dependencies in SSE)
- R007 (mobile-first customer UI) — M002, already delivered

## Sources

- Next.js 16.2.4 Route Handler streaming docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`) — Confirms ReadableStream + async iterator pattern for streaming responses
- Next.js 16.2.4 streaming guide (`node_modules/next/dist/docs/01-app/02-guides/streaming.md`) — Raw stream examples, `X-Content-Type-Options: nosniff` header recommendation
- MDN EventSource API — Built-in auto-reconnect, GET-only, `text/event-stream` content type
- Existing codebase: `src/app/api/order/route.ts`, `src/lib/prisma.ts`, `prisma/schema.prisma` — All patterns directly reusable
