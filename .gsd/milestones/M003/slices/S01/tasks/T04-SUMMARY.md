---
id: T04
parent: S01
milestone: M003
key_files:
  - src/components/staff/useOrderStream.ts
  - src/components/staff/OrderCard.tsx
  - src/components/staff/StationView.tsx
  - src/app/staff/bar/page.tsx
key_decisions:
  - Client-side station item filtering in useOrderStream — SSE broadcasts full orders, hook filters by category (DRINK/FOOD) and re-derives order status from filtered items
  - StationView filters out SERVED/CANCELLED orders from display so only active orders show
  - OrderCard uses getValidNextStatuses() to render only valid action buttons per item status
duration: 
verification_result: passed
completed_at: 2026-05-06T05:52:39.156Z
blocker_discovered: false
---

# T04: useOrderStream hook with SSE real-time updates + OrderCard + StationView + bar station page with station-level item filtering

**useOrderStream hook with SSE real-time updates + OrderCard + StationView + bar station page with station-level item filtering**

## What Happened

Built all four client-side files for the bar station:

1. **useOrderStream.ts** — Custom hook using `useReducer` for order state management. Fetches initial orders from GET `/api/staff/orders?station=bar`, opens SSE EventSource to `/api/staff/orders/stream?station=bar`, and handles `new-order` and `item-status-change` events. Includes client-side station-level item filtering via `filterOrderForStation()` because SSE broadcasts full orders with all items — the bar station must filter to only show DRINK items. Re-derives order status from filtered items using `deriveOrderStatus()`. Returns `{orders, connectionStatus, refetch}`.

2. **OrderCard.tsx** — Client component rendering an order card with: table name (prominent), order ID, timestamp, derived status badge, list of items with name × quantity, notes, per-item status badge with color coding, and action buttons to advance status. Vietnamese labels: 'Nhận đơn' (PENDING→PREPARING), 'Xong' (PREPARING→READY), 'Phục vụ' (READY→SERVED). Buttons call PATCH `/api/staff/orders/:orderId/items/:itemId`. Loading spinner on action, 44px minimum touch target height.

3. **StationView.tsx** — Client component wrapping `useOrderStream` + rendering a grid of OrderCards. Accepts `station` prop. Shows Vietnamese header ('Quầy Bar'/'Bếp'/'Tổng quan'), active order count, SSE connection status indicator (green pulsing dot when connected), refresh button, and empty state: 'Chưa có đơn hàng mới'. Filters out SERVED/CANCELLED orders from display.

4. **staff/bar/page.tsx** — Thin Server Component wrapper rendering `<StationView station="bar" />` with metadata title 'TraSua - Quầy Bar'.

Key design decision: SSE events contain full orders with all items (both DRINK and FOOD). The `useOrderStream` hook applies client-side category filtering via `filterOrderForStation()` to only show station-relevant items. This avoids duplicating the server-side filtering logic in the SSE broadcast path while keeping station views clean.

## Verification

1. `npx next build` — compiled successfully with zero TypeScript errors, `/staff/bar` route present in build output.
2. `npx tsc --noEmit` — zero errors.
3. Browser: navigated to `/staff/bar`, empty state renders correctly ('Chưa có đơn hàng mới').
4. Browser: POST new order via curl with DRINK items → order appeared on bar page within 1 second via SSE.
5. Browser: clicked 'Nhận đơn' → item status changed PENDING→PREPARING, card updated to show 'Đang pha' status and 'Xong' button.
6. Browser: clicked 'Xong' → item status changed PREPARING→READY, card updated to show 'Xong' status and 'Phục vụ' button.
7. Node.js integration test: SSE stream connected → POST order → received `new-order` SSE event → PATCH item status → received `item-status-change` SSE event → PATCH invalid transition (PREPARING→PENDING) → got 409 Conflict response. All 4 checks passed.
8. Station-level filtering verified: FOOD items (Bánh tráng trộn) correctly excluded from bar view after SSE update.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx next build` | 0 | ✅ pass | 9200ms |
| 2 | `npx tsc --noEmit` | 0 | ✅ pass | 5000ms |
| 3 | `SSE integration test (node script: connect SSE, POST order, PATCH status, invalid transition)` | 0 | ✅ pass | 3029ms |
| 4 | `browser_assert: Quầy Bar + Đã kết nối + Bàn 1 + Trà sữa trân châu + Nhận đơn visible` | 0 | ✅ pass | 500ms |

## Deviations

Added client-side item filtering in useOrderStream.ts — not in original plan but necessary because SSE broadcasts full orders with all categories. Without this, bar station would show FOOD items after SSE updates.

## Known Issues

React 19 HMR warning 'Can''t perform a React state update on a component that hasn''t mounted yet' — this is a known React 19 dev-mode artifact, not a production issue. Vietnamese text notes submitted via curl display with encoding artifacts (curl UTF-8 issue, not app issue).

## Files Created/Modified

- `src/components/staff/useOrderStream.ts`
- `src/components/staff/OrderCard.tsx`
- `src/components/staff/StationView.tsx`
- `src/app/staff/bar/page.tsx`
