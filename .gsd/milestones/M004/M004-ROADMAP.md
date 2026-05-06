# M004: Bill & Checkout

**Vision:** Complete the order lifecycle by adding a checkout/billing tab to the staff dashboard. Staff can view aggregated bills per table, cancel items, add new items, and mark tables as paid — with real-time SSE updates across all stations.

## Success Criteria

- Staff opens '💰 Tính tiền' tab → sees all tables with unpaid orders → taps a table → sees aggregated bill across all orders
- Bill displays items with name, quantity, price, status; cancelled items shown with line-through and excluded from total
- Cancel item from bill via two-tap confirmation → bill total updates → SSE broadcast to stations
- Mark paid via two-tap confirmation → all table orders → PAID with paidAt → SSE broadcast → stations clear paid orders → table disappears from checkout list
- Add item from bill via menu picker modal → item added to latest unpaid order → bill total updates → SSE broadcast to relevant station
- New QR scan on paid table → new order works normally (query filters to unpaid orders only)
- Unit tests pass for bill aggregation, PAID transition, PAID guard on item modifications

## Slices

- [x] **S01: S01** `risk:medium` `depends:[]`
  > After this: Staff opens '💰 Tính tiền' tab → sees tables with unpaid orders → taps a table → sees aggregated bill (items from multiple orders, cancelled items struck through) → cancels an item (two-tap) → total updates → taps 'Đã thanh toán' (two-tap) → all orders → PAID → table disappears from list → bar/kitchen stations clear paid orders via SSE.

- [x] **S02: S02** `risk:medium` `depends:[]`
  > After this: On bill detail view, staff taps '+ Thêm món' → modal opens with DRINK/FOOD tabs showing available menu items → selects an item, enters quantity → submits → item appears on bill → total recalculates → bar/kitchen station receives new item via SSE.

## Boundary Map

## Horizontal Checklist

- **Requirements re-read:** R004 is the primary deliverable; R008 extended with bill-context cancel/add. R002/R003 protected via PAID exclusion and SSE integration. R006/R007 constraints maintained.
- **Decisions re-evaluated:** D001 (tech stack), D005 (no auth on staff routes), D008 (station-first slices), D009 (SSE registry), D010 (shared StationView) all remain valid. No conflicts with M004 additions.
- **Shared resources:** SSE subscriber registry extended with `order-paid` event type. `useOrderStream` reducer needs REMOVE action for paid orders. `order-status.ts` module unchanged — PAID handled at API level.
- **Reconnection:** Checkout page inherits SSE reconnection pattern from StationView (disconnect/reconnect banners). Bill data refetched on reconnect.
- **Auth boundary:** No auth needed (D005 — local WiFi is security boundary). Checkout endpoints follow same pattern as existing staff routes.
- **Revenue paths:** `paidAt` timestamp on Order enables future revenue reporting (explicitly out of scope for M004 but schema supports it).
- **Graceful degradation:** If SSE disconnects, bill view still functions via manual refresh. Mark-paid is server-authoritative — SSE is notification only.
