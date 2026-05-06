# S01: Bar Station End-to-End (SSE + API + UI) — UAT

**Milestone:** M003
**Written:** 2026-05-06T05:57:00.188Z

# UAT: S01 — Bar Station End-to-End

## UAT Type
**Manual integration UAT** — verifies the end-to-end real-time flow from customer order submission through SSE delivery to bar station display and status transitions.

## Preconditions
1. Dev server running at localhost:3000
2. Database seeded with menu items (12 DRINK, 6 FOOD) and tables
3. At least one DRINK menu item is available (isAvailable: true)

---

## Test Cases

### TC-01: Bar station loads empty state
1. Navigate to `http://localhost:3000/staff/bar`
2. **Expected:** Page renders with Vietnamese heading and empty state message
3. **Expected:** No console errors in browser dev tools

### TC-02: New drink order appears on bar station via SSE
1. Open `http://localhost:3000/staff/bar` in Tab A
2. Open `http://localhost:3000/order?table=1` in Tab B
3. In Tab B, add 1 DRINK item to cart → submit order
4. **Expected:** Tab B shows confirmation screen
5. **Expected:** Tab A shows the new order within 3 seconds (no page refresh)
6. **Expected:** Order card shows table number "Bàn 1", drink item name, status badge "PENDING"

### TC-03: Bar station filters — only DRINK items shown
1. Open `http://localhost:3000/staff/bar` in Tab A
2. Submit a new order containing 1 DRINK item AND 1 FOOD item (e.g., from /order?table=2)
3. **Expected:** Tab A shows the order card with only the DRINK item
4. **Expected:** The FOOD item does NOT appear on the bar station

### TC-04: Status transition PENDING → PREPARING → READY
1. On the bar station page, find an order with PENDING item(s)
2. Tap the action button to advance item to PREPARING
3. **Expected:** Item status badge changes to "PREPARING"
4. **Expected:** Action button now shows the next valid transition (to READY)
5. Tap the action button to advance item to READY
6. **Expected:** Item status badge changes to "READY"
7. **Expected:** No further forward action button (SERVED is runner's job on overview)

### TC-05: Order status auto-derives from item statuses
1. Submit an order with 2 DRINK items
2. On bar station, advance first item to PREPARING (leave second as PENDING)
3. **Expected:** Order-level status shows "PREPARING" (any item past PENDING → PREPARING)
4. Advance both items to READY
5. **Expected:** Order-level status shows "READY"

### TC-06: Invalid status transition blocked
1. Using curl or API client: PATCH `/api/staff/orders/{orderId}/items/{itemId}` with `{"status": "PENDING"}` on an item that is currently PREPARING
2. **Expected:** Response is 409 Conflict with body `{"error": "Invalid status transition", "currentStatus": "PREPARING", "targetStatus": "PENDING"}`

### TC-07: Cancel item via API
1. PATCH `/api/staff/orders/{orderId}/items/{itemId}` with `{"action": "cancel"}`
2. **Expected:** Response is 200, item status is CANCELLED
3. **Expected:** Bar station UI updates to show CANCELLED status on the item

### TC-08: Multiple station pages open simultaneously
1. Open `http://localhost:3000/staff/bar` in 3 separate browser tabs
2. Submit a new order with a DRINK item
3. **Expected:** All 3 tabs receive and display the new order within 3 seconds
4. Advance an item status on one tab
5. **Expected:** All 3 tabs reflect the status change

### TC-09: SSE reconnection on disconnect
1. Open bar station page, verify SSE is connected (order appears in real-time)
2. Stop the dev server, wait 5 seconds, restart the dev server
3. **Expected:** After server restarts, EventSource auto-reconnects
4. Submit a new order
5. **Expected:** Order appears on the bar station (may take a few extra seconds for reconnect)

### TC-10: Vietnamese UI text
1. Navigate to `http://localhost:3000/staff/bar`
2. **Expected:** All visible text is in Vietnamese (heading, empty state, status labels, action buttons)

---

## Not Proven By This UAT
- **Kitchen station filtering** — Only bar (DRINK) filtering is tested. Kitchen (FOOD) filtering is S02 scope.
- **Overview/runner station** — No overview page exists yet. SERVED transitions are S02 scope.
- **Item cancellation with totalAmount recalculation** — Cancel API works but totalAmount recalculation and its propagation are S02 scope.
- **Notification chimes and auto-hide** — S03 scope.
- **Disconnection banner UI** — S03 scope. TC-09 tests reconnection but not the visual banner.
- **Performance under load** — No load testing performed. Single-user and small-scale multi-tab only.
- **Cross-browser/device testing** — Not tested on actual tablets or multiple browsers.
- **Network latency simulation** — All testing on localhost, no real WiFi network latency simulated.

