# M003: Staff Dashboard

**Gathered:** 2025-07-17
**Status:** Ready for planning

## Project Description

A real-time order management dashboard for bubble tea shop staff, served at three URLs on the local network. Bar and kitchen stations each see only their relevant items, while an overview screen lets a runner/cashier track delivery. Orders stream in via SSE within 3 seconds of customer submission. Staff advance individual item statuses with single taps. The dashboard is unauthenticated — the shop's local WiFi is the security boundary.

## Why This Milestone

M002 delivered the full customer ordering flow: QR scan → menu → cart → order submission → confirmation. Orders now persist to the database as PENDING, but no one can see them. The staff currently has zero visibility into incoming orders. M003 closes this critical loop — without it, the entire QR ordering system is useless because orders go nowhere.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Bar staff open `/staff/bar` on their tablet and see only drink orders streaming in real-time, tapping each item through PENDING → PREPARING → READY
- Kitchen staff open `/staff/kitchen` on their tablet and see only food orders, same flow
- Runner/cashier opens `/staff` overview and marks READY items as SERVED when delivered to the table
- Staff hear a notification chime and see a visual flash when a new order arrives
- Staff can cancel individual items from an order (item status → CANCELLED, totalAmount recalculated)

### Entry point / environment

- Entry point: `http://<local-ip>:3000/staff`, `/staff/bar`, `/staff/kitchen`
- Environment: local network — tablet/laptop at each station, accessed via shop WiFi
- Live dependencies involved: SQLite database (existing), SSE stream (new)

## Completion Class

- Contract complete means: API endpoints return correct order/item data filtered by category, SSE delivers events within 3 seconds, status PATCH updates items and auto-derives order status, cancel recalculates totalAmount — all provable by integration tests against the SQLite DB
- Integration complete means: customer places order on phone → bar/kitchen station shows it in real-time → staff advances status → overview reflects changes — full loop across browser sessions
- Operational complete means: SSE reconnects after network blip, multiple stations can be open simultaneously without conflict, completed items auto-hide after 5 minutes

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Customer submits an order with both drink and food items → bar station shows only the drink items within 3 seconds, kitchen station shows only the food items within 3 seconds, both via SSE
- Bar staff taps items through PREPARING → READY, kitchen does the same → overview shows Order status auto-derived as READY when all items are READY → runner marks SERVED
- Staff cancels an item from an order → item shows CANCELLED, order's totalAmount is recalculated server-side, SSE broadcasts the change to all connected stations
- These scenarios cannot be simulated — they require multiple browser windows open simultaneously on the running app with SSE connections active

## Architectural Decisions

### Separate Station URLs, Not Tab Filters

**Decision:** Three distinct routes: `/staff` (overview, all orders), `/staff/bar` (DRINK items only), `/staff/kitchen` (FOOD items only).

**Rationale:** Bar and kitchen are physically separate stations with their own devices (tablets). Each station should only see what they need to prepare. The existing `Category` enum (DRINK/FOOD) on MenuItem maps directly to station routing. Separate URLs mean each device can bookmark their station.

**Alternatives Considered:**
- Single page with tab filters — requires sharing one screen or switching tabs, doesn't match physical station layout
- Both (overview + station URLs) — adds complexity; the overview already serves the runner/cashier role

### No Authentication for Staff Dashboard

**Decision:** `/staff/*` routes are open — no middleware protection. Only `/admin/*` requires password (existing auth).

**Rationale:** The system runs on the shop's local WiFi. The network itself is the security boundary. Staff shouldn't have to log in every shift on a shared tablet. Customers are unlikely to guess the `/staff` URL, and even if they did, read-only visibility of orders isn't harmful.

**Alternatives Considered:**
- Simple PIN code — adds friction for no real security gain on a local network
- Reuse admin password — conflates two different access levels

### SSE for Real-Time Order Updates

**Decision:** Server-Sent Events (SSE) via a `/api/staff/orders/stream` Route Handler. One-way server → client push.

**Rationale:** SSE is the simplest real-time mechanism that fits this use case. The dashboard only needs to receive updates (new orders, status changes), never send them (status changes go via regular POST/PATCH). Native `EventSource` API has built-in auto-reconnect. No WebSocket complexity, no external dependencies (Socket.io, Pusher), stays within the local-first constraint.

**Alternatives Considered:**
- Polling every 3-5 seconds — simpler to implement but not truly real-time, wastes DB queries, ~3s delay on new orders
- WebSocket — bidirectional overkill, more complex server setup for Next.js

### Per-Item Status Tracking with Auto-Derived Order Status

**Decision:** Staff advance individual OrderItem statuses. The Order-level status is auto-derived from the aggregate of its items' statuses.

**Rationale:** The Prisma schema already has `ItemStatus` per OrderItem — this uses the schema as designed. In reality, a barista finishes drinks one at a time, not all at once. Per-item tracking reflects the actual workflow. Auto-deriving order status keeps it consistent without manual coordination.

**Derivation rules:**
- All items PENDING → Order PENDING
- Any item PREPARING (others still PENDING) → Order PREPARING
- All non-cancelled items READY → Order READY
- All non-cancelled items SERVED → Order SERVED
- All items CANCELLED → Order CANCELLED

**Alternatives Considered:**
- Per-order status (all items advance together) — doesn't reflect partial completion, wastes the ItemStatus schema

### Skip CONFIRMED Status

**Decision:** The `CONFIRMED` value in the `OrderStatus` enum is left unused. Orders go directly from PENDING to PREPARING (auto-derived from first item status change).

**Rationale:** CONFIRMED would require an extra tap with no practical value — the act of tapping "Nhận đơn" on the first item already confirms the order is acknowledged. Keeping the enum value doesn't hurt (no migration needed), but the workflow skips it.

### Cancel Items Only (R008 Partial)

**Decision:** M003 delivers item cancellation from the dashboard. Adding items to an existing order from the dashboard is deferred to M005.

**Rationale:** Customers already have "Gọi thêm món" to add more items (creates a new order for the same table). Staff-initiated item addition requires a menu picker UI in the dashboard — that's M005's menu management territory. Cancellation is the urgent need (customer changes mind, item unavailable).

**Alternatives Considered:**
- Full R008 in M003 (cancel + add) — adds significant UI complexity (menu item picker in dashboard) and blurs the line with menu management (M005)

---

> See `.gsd/DECISIONS.md` for the full append-only register of all project decisions.

## Error Handling Strategy

- **SSE disconnection:** `EventSource` auto-reconnects (built-in). On reconnect, the client fetches a full snapshot of current active orders to sync state, then resumes incremental SSE events. Display a subtle "Đang kết nối lại..." banner while disconnected.
- **Stale state:** If SSE reconnect fails for >30 seconds, show a visible warning and fall back to a manual refresh button.
- **Concurrent status updates:** Two staff tap the same item simultaneously — the server is the source of truth. PATCH endpoint uses current DB status to determine valid transitions. Invalid transitions (e.g., trying to move READY back to PENDING) return 409 Conflict. Client receives the corrected state via SSE.
- **Cancel recalculation:** Server recomputes totalAmount from non-cancelled items. If all items cancelled, order status auto-derives to CANCELLED.
- **Missing orders on page load:** Initial GET endpoint loads all active (non-SERVED, non-CANCELLED) orders. SSE handles incremental updates from that point.

## Risks and Unknowns

- **SSE in Next.js App Router** — Route Handlers support streaming responses, but SSE patterns with long-lived connections in Next.js 16 need to be validated. Risk: connection lifecycle management, HMR interference in dev mode.
- **Multiple concurrent SSE clients** — Multiple stations connected simultaneously. Need an in-memory subscriber registry that broadcasts to all connected clients. Risk: memory leaks if connections aren't cleaned up on disconnect.
- **SQLite write contention** — Multiple stations updating item statuses simultaneously. SQLite handles concurrent reads well but serializes writes. Risk: low (local network, single-digit concurrent writes), but worth noting.
- **Browser audio autoplay** — Notification sounds require user interaction to enable in modern browsers. May need a "Bật thông báo" button on first visit to unlock audio context.

## Existing Codebase / Prior Art

- `prisma/schema.prisma` — Order, OrderItem, MenuItem, Table models with OrderStatus and ItemStatus enums already defined. Category enum (DRINK/FOOD) for station routing.
- `src/app/api/order/route.ts` — POST endpoint creating orders with Prisma transactions. Pattern for new PATCH/GET endpoints.
- `src/middleware.ts` — Protects `/admin/*` only. Staff routes intentionally excluded.
- `src/lib/prisma.ts` — PrismaClient singleton with globalThis caching. All new queries use this.
- `src/lib/format.ts` — `formatVND()` utility for Vietnamese currency formatting.
- `src/lib/auth.ts` — Admin auth helpers. Not used for staff routes.
- `src/components/order/` — Customer-facing component patterns (CartProvider, CartUI, etc.) — reference for component structure.

## Relevant Requirements

- R001 — M003 completes the second half: "nhân viên nhận được" (staff receives the order). Customer side delivered in M002.
- R002 — Directly fulfilled: automatic routing of drink items to bar, food items to kitchen, based on MenuItem.category.
- R003 — Directly fulfilled: real-time dashboard with status tracking, <3 second update via SSE.
- R008 — Partially fulfilled: item cancellation from dashboard. Adding items deferred to M005.

## Scope

### In Scope

- `/staff` overview page showing all active orders with table number, items, and status
- `/staff/bar` station page showing only DRINK items from active orders
- `/staff/kitchen` station page showing only FOOD items from active orders
- SSE endpoint at `/api/staff/orders/stream` broadcasting new orders and status changes
- GET endpoint for initial order snapshot on page load
- PATCH endpoint for advancing individual item status (PENDING→PREPARING→READY→SERVED)
- PATCH endpoint for cancelling individual items
- Auto-derived order status from item statuses
- Order recalculation on item cancellation (totalAmount update)
- Sound notification + visual flash for new orders (with mute toggle)
- Auto-hide completed items after 5 minutes with history toggle
- Separate order cards per order (not grouped by table)
- Tablet/desktop-optimized responsive layout
- Vietnamese UI text

### Out of Scope / Non-Goals

- Staff adding items to existing orders from dashboard (deferred to M005)
- Billing / payment marking (M004)
- Menu management / availability toggle from dashboard (M005)
- Customer-facing order status tracking ("where's my order")
- Print/KOT (Kitchen Order Ticket) functionality
- Multi-shop / cloud deployment
- Staff user accounts or role-based permissions

## Technical Constraints

- SQLite single-file database — no concurrent write issues at this scale, but SSE broadcast must be in-memory (no external pub/sub)
- Local network only — no CDN, no external services, no internet dependency
- Next.js 16 App Router — SSE via Route Handlers, Server Components for initial render, Client Components for interactive dashboard
- No WebSocket library — SSE only, using native `EventSource` on client
- Existing admin auth middleware must not interfere with `/staff/*` routes (currently only matches `/admin/*`)

## Integration Points

- **Customer Order API (`POST /api/order`)** — Existing endpoint creates orders that the staff dashboard reads. New orders trigger SSE events to connected stations.
- **Prisma/SQLite** — All order reads and status updates go through the PrismaClient singleton. New queries filter by Category for station routing.
- **SSE Subscriber Registry** — In-memory Map of connected clients. Order creation and status update endpoints broadcast events to all subscribers after DB writes.
- **Browser EventSource API** — Client-side SSE consumption with auto-reconnect. Initial snapshot via GET, then incremental updates via SSE.

## Testing Requirements

- **Integration tests:** POST order → verify SSE delivers event. PATCH item status → verify order status auto-derives correctly. Cancel item → verify totalAmount recalculated.
- **Status transition tests:** Verify valid transitions (PENDING→PREPARING→READY→SERVED) succeed and invalid transitions (READY→PENDING) return 409.
- **Station filtering tests:** Verify `/staff/bar` endpoint returns only DRINK items, `/staff/kitchen` returns only FOOD items.
- **Edge cases:** All items cancelled → order CANCELLED. Mixed statuses → correct derivation. Empty orders after all cancellations.
- **E2E:** Multi-window test — customer places order, bar station sees it, bar advances items, overview reflects changes.

## Acceptance Criteria

### Station Pages
- `/staff/bar` shows only OrderItems where menuItem.category = DRINK
- `/staff/kitchen` shows only OrderItems where menuItem.category = FOOD
- `/staff` overview shows all orders with aggregated status
- Each order card displays: table number, order ID, timestamp, item list with quantities and notes

### Real-Time Updates
- New order appears on relevant station within 3 seconds of submission (SSE)
- Status changes broadcast to all connected stations within 1 second
- SSE auto-reconnects after disconnection, syncs full state on reconnect

### Status Workflow
- Station staff can advance items: PENDING → PREPARING → READY
- Overview staff can advance: READY → SERVED
- Order status auto-derives from item statuses per derivation rules
- Invalid status transitions return 409 Conflict

### Item Cancellation
- Staff can cancel individual items (status → CANCELLED)
- Cancelled items remain visible (greyed out) but excluded from active workflow
- Order totalAmount recalculated server-side excluding cancelled items
- If all items cancelled, order auto-derives to CANCELLED

### Notifications
- New order triggers notification sound (browser Audio API)
- New order card has pulsing visual highlight
- Mute toggle available on each station page
- Audio unlock prompt on first visit if autoplay blocked

### Auto-Hide
- READY/SERVED items remain visible for 5 minutes, then auto-hide
- "Lịch sử" toggle expands collapsed history section
- Active items always visible at top of list

## Open Questions

- **SSE keep-alive interval** — What heartbeat interval prevents proxy/browser timeout? Likely 15-30 seconds. Will determine during implementation.
- **Order ID display format** — Raw auto-increment ID (#42) or formatted (e.g., daily reset counter)? Leaning toward raw ID for simplicity.
- **Sound file** — Need a short, pleasant notification chime. Will source or generate a royalty-free .mp3.
