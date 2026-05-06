---
estimated_steps: 32
estimated_files: 4
skills_used: []
---

# T02: Add auto-hide completed items with Lịch sử toggle and disconnection banner

Replace StationView's hard filter of SERVED/CANCELLED orders with a three-bucket display: active orders shown normally, recently completed (within 5 minutes) shown greyed out, and older completed orders hidden behind a 'Lịch sử' toggle. Add a disconnection banner that appears after 3 seconds of SSE error/disconnect, and a brief reconnection success banner.

## Steps

1. **Create `src/lib/categorize-orders.ts`** — Export a pure function `categorizeOrders(orders, completedAtMap, now, hideAfterMs = 5 * 60 * 1000)` that splits orders into `{ active, recentlyCompleted, hidden }` arrays. Active = derivedStatus not SERVED/CANCELLED. RecentlyCompleted = derivedStatus is SERVED/CANCELLED AND `now - completedAt < hideAfterMs`. Hidden = the rest. This is extracted for testability.

2. **Create `src/lib/__tests__/categorize-orders.test.ts`** — Unit tests for the pure categorization function: (a) active orders pass through, (b) newly completed orders land in recentlyCompleted, (c) orders completed >5min ago land in hidden, (d) orders without a completedAt entry that are SERVED go to recentlyCompleted (new completion detected), (e) edge case: exactly at boundary.

3. **Modify `src/components/staff/StationView.tsx` content area** — Remove the existing `activeOrders` filter that drops SERVED/CANCELLED. Replace with:
   - `completedAtRef` (useRef Map<number, number>) tracking when each order first appeared with SERVED/CANCELLED derivedStatus
   - `useEffect` watching `orders` to detect newly-completed orders and record timestamps
   - `setInterval` every 30 seconds to re-evaluate buckets (force re-render via state tick)
   - Call `categorizeOrders()` to get three arrays
   - Render active orders in the main grid (unchanged)
   - Render recentlyCompleted orders below in a smaller, greyed-out section with "Đã xong" label and reduced opacity
   - `showHistory` state toggled by "Lịch sử (N)" button — when true, also render hidden orders in the greyed section
   - "Lịch sử" button in header area with count badge, 44px touch target
   - Clean up interval and timeouts on unmount

4. **Add disconnection banner to `src/components/staff/StationView.tsx`** — Below the header, conditionally render a full-width banner:
   - When `connectionStatus` is 'error' or 'disconnected' for >3 seconds: amber/red banner with "⚠️ Mất kết nối — Đang kết nối lại..." and a "Tải lại" button calling `refetch()`
   - Use `useState` + `useEffect` with `setTimeout(3000)` to debounce brief disconnections
   - When connection restores to 'connected' after being in error state: show green "✅ Đã kết nối lại" banner for 2 seconds, then auto-hide
   - Banner uses `transition-all` for smooth enter/exit (slide down from header)

5. **Update `src/app/globals.css`** if needed for greyed-out order card styles (opacity, desaturate filter).

## Must-Haves

- [ ] Active orders display unchanged from current behavior
- [ ] SERVED/CANCELLED orders visible for 5 minutes after transition, then auto-hidden
- [ ] "Lịch sử (N)" toggle reveals hidden orders with accurate count
- [ ] Disconnection banner only appears after 3+ seconds of error (not on brief reconnects)
- [ ] Reconnection success banner auto-hides after 2 seconds
- [ ] "Tải lại" button in disconnection banner calls refetch()
- [ ] 30-second interval for re-evaluating time-based buckets (not every render)
- [ ] All timers/intervals cleaned up on unmount
- [ ] Pure categorizeOrders function has unit test coverage
- [ ] All UI text Vietnamese
- [ ] Touch targets ≥44px

## Inputs

- ``src/components/staff/StationView.tsx` — modified in T01 with notification wiring, now adding auto-hide and banner`
- ``src/components/staff/useOrderStream.ts` — modified in T01, provides orders and connectionStatus`
- ``src/app/globals.css` — modified in T01 with pulse keyframes, may add greyed-out styles`

## Expected Output

- ``src/lib/categorize-orders.ts` — new pure function for order time-based bucketing`
- ``src/lib/__tests__/categorize-orders.test.ts` — unit tests for categorization logic`
- ``src/components/staff/StationView.tsx` — modified with auto-hide logic, Lịch sử toggle, disconnection banner, reconnection banner`
- ``src/app/globals.css` — modified with greyed-out completed order styles if needed`

## Verification

npx tsc --noEmit && npx vitest run
