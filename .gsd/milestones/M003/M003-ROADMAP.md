# M003: Staff Dashboard

**Vision:** Real-time order management dashboard for bar, kitchen, and runner stations — the critical link between customer orders (M002) and physical preparation workflow. SSE streams orders to station-filtered views; staff advance items through PENDING → PREPARING → READY → SERVED with single taps.

## Success Criteria

- Customer submits order with drink+food items → bar station shows only drink items within 3 seconds via SSE, kitchen station shows only food items within 3 seconds
- Bar staff taps items through PREPARING → READY, kitchen does the same → overview shows order status auto-derived as READY → runner marks SERVED
- Staff cancels an item → item shows CANCELLED, order totalAmount is recalculated server-side, SSE broadcasts the change to all connected stations
- Multiple station pages can be open simultaneously without SSE connection conflicts
- All UI text is Vietnamese, layout is tablet/desktop optimized

## Slices

- [x] **S01: S01** `risk:high` `depends:[]`
  > After this: Customer submits order containing drinks → /staff/bar page shows the drink items within 3 seconds via SSE → bar staff taps items through PENDING → PREPARING → READY, order status auto-derives correctly

- [x] **S02: S02** `risk:medium` `depends:[]`
  > After this: Mixed order (drink+food) → bar sees only drinks, kitchen sees only food items. Overview shows all orders. Staff cancels an item → totalAmount recalculated, SSE broadcasts change. Runner marks READY items as SERVED on overview.

- [x] **S03: S03** `risk:low` `depends:[]`
  > After this: New order triggers notification chime with pulsing visual highlight. Mute toggle silences future chimes. Completed items auto-hide after 5 minutes. 'Lịch sử' toggle reveals hidden items. Disconnection banner appears when SSE drops.

## Boundary Map

### Horizontal Checklist\n\n- [x] **Requirements re-read** — All 8 active requirements analyzed. R001/R002/R003/R008 mapped to slices. R004 explicitly M004 scope. R005 already delivered. R006/R007 are cross-cutting constraints respected throughout.\n- [x] **Decisions re-evaluated** — D001 (SSE choice), D003 (staff-only cancel), D006/D007 (Route Handler patterns) all still valid. New decisions: station-first decomposition, shared StationView component.\n- [x] **Auth boundary** — Middleware only protects `/admin/*`. Staff routes (`/staff/*`) intentionally open per architectural decision (local WiFi is security boundary). No changes needed.\n- [x] **Shared resources** — SSE subscriber registry stored on `globalThis` (same pattern as Prisma singleton). All DB access through existing `src/lib/prisma.ts`.\n- [x] **Reconnection** — EventSource auto-reconnect is built-in. On reconnect, client fetches full snapshot then resumes SSE. Disconnection banner in S03.\n- [x] **Graceful shutdown** — Not applicable for local dev server. SSE controllers cleaned up on client disconnect via `request.signal` abort.\n- [x] **Revenue paths** — Not applicable (internal tool, no monetization).\n- [x] **Schema migrations** — None needed. Prisma schema already has OrderStatus, ItemStatus, Category enums as designed.
