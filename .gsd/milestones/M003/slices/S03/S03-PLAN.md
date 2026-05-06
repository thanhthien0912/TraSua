# S03: Notifications & Auto-Hide Polish

**Goal:** New order triggers notification chime with pulsing visual highlight. Mute toggle silences future chimes. Completed items auto-hide after 5 minutes. 'Lịch sử' toggle reveals hidden items. Disconnection banner appears when SSE drops.
**Demo:** New order triggers notification chime with pulsing visual highlight. Mute toggle silences future chimes. Completed items auto-hide after 5 minutes. 'Lịch sử' toggle reveals hidden items. Disconnection banner appears when SSE drops.

## Must-Haves

- New order SSE event → amber pulse highlight on OrderCard + audible two-tone chime via Web Audio API
- Mute toggle in station header persists to localStorage — muted state skips audio but still shows visual highlight
- Audio unlock prompt appears on first visit when browser blocks autoplay — tap unlocks AudioContext
- Orders that transition to SERVED/CANCELLED show greyed-out in a "recently completed" section for 5 minutes, then auto-hide
- "Lịch sử (N)" toggle button reveals all hidden orders, count badge shows hidden count
- SSE disconnection for >3 seconds shows amber/red banner: "⚠️ Mất kết nối — Đang kết nối lại... [Tải lại]"
- Reconnection shows brief green "✅ Đã kết nối lại" banner for 2 seconds then hides
- `npx tsc --noEmit` passes, `npx vitest run` passes including new categorize-orders test
- All UI text Vietnamese, touch targets ≥44px

## Proof Level

- This slice proves: Integration — features exercise real SSE events, browser Audio API, and timer-based state management in the running dev server. No mock-only proof.

## Integration Closure

Upstream surfaces consumed: `useOrderStream` hook (SSE events, connectionStatus, refetch), `OrderCard` component, `StationView` component, `globals.css` theme.
New wiring: `useNotification` hook created, `onNewOrder` callback added to `useOrderStream`, pulse animation CSS, disconnection banner in `StationView`.
What remains: Nothing — this is the final slice in M003. After S03, the staff dashboard milestone is feature-complete.

## Verification

- Console logs from useNotification: `[useNotification] Chime played`, `[useNotification] AudioContext unlocked`, `[useNotification] Muted`. Console logs from disconnection banner state transitions. Existing useOrderStream console logs cover SSE connection lifecycle.

## Tasks

- [x] **T01: Add notification chime with visual pulse and mute toggle** `est:1h`
  Create the notification system: a `useNotification` hook that plays a two-tone chime via Web Audio API on new orders, a pulsing amber highlight on new OrderCards, and a mute toggle in the StationView header with localStorage persistence. Handle browser autoplay policy by detecting AudioContext lock and showing an unlock prompt.
  - Files: `src/components/staff/useNotification.ts`, `src/components/staff/useOrderStream.ts`, `src/components/staff/OrderCard.tsx`, `src/components/staff/StationView.tsx`, `src/app/globals.css`
  - Verify: npx tsc --noEmit && npx vitest run

- [x] **T02: Add auto-hide completed items with Lịch sử toggle and disconnection banner** `est:1h`
  Replace StationView's hard filter of SERVED/CANCELLED orders with a three-bucket display: active orders shown normally, recently completed (within 5 minutes) shown greyed out, and older completed orders hidden behind a 'Lịch sử' toggle. Add a disconnection banner that appears after 3 seconds of SSE error/disconnect, and a brief reconnection success banner.
  - Files: `src/lib/categorize-orders.ts`, `src/lib/__tests__/categorize-orders.test.ts`, `src/components/staff/StationView.tsx`, `src/app/globals.css`
  - Verify: npx tsc --noEmit && npx vitest run

## Files Likely Touched

- src/components/staff/useNotification.ts
- src/components/staff/useOrderStream.ts
- src/components/staff/OrderCard.tsx
- src/components/staff/StationView.tsx
- src/app/globals.css
- src/lib/categorize-orders.ts
- src/lib/__tests__/categorize-orders.test.ts
