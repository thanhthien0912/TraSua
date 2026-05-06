---
estimated_steps: 7
estimated_files: 4
skills_used: []
---

# T04: useOrderStream hook + bar station page UI

Build the client-side hook and the complete bar station page.

**Steps:**
1. Create `src/components/staff/useOrderStream.ts` — Custom hook that: (a) fetches initial orders from GET /api/staff/orders?station={station}, (b) opens EventSource to /api/staff/orders/stream?station={station}, (c) maintains order state via useReducer, (d) handles new-order events by adding to state, (e) handles item-status-change events by updating the affected order in state, (f) handles SSE error/close by setting a connectionStatus state. Return `{orders, connectionStatus, refetch}`.
2. Create `src/components/staff/OrderCard.tsx` — Client component displaying an order card with: table number (prominent), order ID and timestamp, list of items with name × quantity, notes, status badge per item, and an action button per item to advance status (PENDING→PREPARING→READY). The button calls PATCH /api/staff/orders/:orderId/items/:itemId. Use amber/warm theme from globals.css. Vietnamese labels: 'Nhận đơn' for PENDING→PREPARING, 'Xong' for PREPARING→READY. Show status badges with color coding.
3. Create `src/components/staff/StationView.tsx` — Client component wrapping useOrderStream + rendering a grid of OrderCards. Accepts `station` prop ('bar'|'kitchen'|'all'). Shows a header with station name in Vietnamese ('Quầy Bar', 'Bếp', 'Tổng quan'). Empty state: 'Chưa có đơn hàng mới'.
4. Create `src/app/staff/bar/page.tsx` — Server Component that renders `<StationView station="bar" />`. Set metadata title to 'TraSua - Quầy Bar'.
5. Style for tablet: large touch targets (min 44px), readable font sizes, grid layout that works on 768px+ screens. Order cards should show prominently with clear visual hierarchy.

## Inputs

- `src/lib/format.ts — formatVND`
- `src/app/globals.css — theme variables`
- `src/app/api/staff/orders/route.ts — GET endpoint`
- `src/app/api/staff/orders/stream/route.ts — SSE endpoint`
- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts — PATCH endpoint`

## Expected Output

- `src/components/staff/useOrderStream.ts`
- `src/components/staff/OrderCard.tsx`
- `src/components/staff/StationView.tsx`
- `src/app/staff/bar/page.tsx`

## Verification

Dev server runs without errors. Navigate to /staff/bar — page renders with empty state or seed data. Submit order from /order page — new order appears on /staff/bar within 3 seconds via SSE. Tap status buttons — items advance through PENDING→PREPARING→READY.
