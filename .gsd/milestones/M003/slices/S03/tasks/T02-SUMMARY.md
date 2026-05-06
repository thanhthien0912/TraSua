---
id: T02
parent: S03
milestone: M003
key_files:
  - src/lib/categorize-orders.ts
  - src/lib/__tests__/categorize-orders.test.ts
  - src/components/staff/StationView.tsx
  - src/app/globals.css
key_decisions:
  - Extracted categorizeOrders as pure function for testability — all time-dependent logic injectable via `now` and `hideAfterMs` params
  - Used completedAtRef (Map) + bucketTick state for 30s interval re-evaluation rather than per-render Date.now() calls
  - Disconnection banner uses max-h + opacity transition trick for smooth slide-down/up animation without JS animation libraries
  - Greyed-out completed orders use CSS opacity + desaturate filter at section level (not per-card) for clean visual separation
duration: 
verification_result: passed
completed_at: 2026-05-06T06:33:03.558Z
blocker_discovered: false
---

# T02: Added auto-hide completed orders with Lịch sử toggle, disconnection banner with 3s debounce, and reconnection success banner

**Added auto-hide completed orders with Lịch sử toggle, disconnection banner with 3s debounce, and reconnection success banner**

## What Happened

Implemented three-bucket order display, history toggle, and connection status banners across four files:

1. **Created `src/lib/categorize-orders.ts`** — Pure function `categorizeOrders(orders, completedAtMap, now, hideAfterMs)` splits orders into `{ active, recentlyCompleted, hidden }`. Active = derivedStatus not SERVED/CANCELLED. RecentlyCompleted = SERVED/CANCELLED within the time window. Hidden = past the window. Orders first seen as completed without a tracked timestamp go to recentlyCompleted (caller records on next tick). Extracted for testability.

2. **Created `src/lib/__tests__/categorize-orders.test.ts`** — 9 unit tests covering: active passthrough, recently completed within window, hidden after >5min, first-seen completion without timestamp, exact boundary (hidden at ==5min), 1ms-before boundary (recent), mixed bucket scenario, custom hideAfterMs parameter, and empty input.

3. **Modified `src/components/staff/StationView.tsx`** — Major rework replacing the hard `activeOrders` filter:
   - `completedAtRef` (Map<number, number>) tracks when each order first became SERVED/CANCELLED via a `useEffect` on `orders`
   - 30-second `setInterval` increments `bucketTick` state to force re-evaluation of time-based buckets without per-render recalc
   - `useMemo` calls `categorizeOrders()` keyed on orders and bucketTick
   - Active orders render in the main grid unchanged
   - Recently completed orders render below in a "Đã xong" section with `.completed-orders-section` (greyed/desaturated)
   - "Lịch sử (N)" button in header (44px touch target) toggles `showHistory` state — when true, hidden orders also render in a "Lịch sử" section
   - Disconnection banner: `showDisconnectBanner` state activates after 3 seconds of continuous error/disconnected status via `setTimeout` debounce. Shows "⚠️ Mất kết nối — Đang kết nối lại..." with a "Tải lại" button that calls `refetch()`. Uses `transition-all duration-300` with `max-h` trick for smooth slide animation.
   - Reconnection banner: When connection restores after being disconnected, shows "✅ Đã kết nối lại" green banner for 2 seconds. `wasDisconnectedRef` tracks whether we were in error state.
   - All timers/intervals properly cleaned up on unmount via separate cleanup effects.
   - Console logs for banner state transitions: `[StationView] Disconnection banner shown`, `[StationView] Reconnection banner shown`, `[StationView] Reconnection banner hidden`.

4. **Modified `src/app/globals.css`** — Added `.completed-orders-section` with `opacity: 0.55` and `filter: saturate(0.3)`, plus hover state at `opacity: 0.75` and `saturate(0.5)` for interactive discovery. Smooth CSS transitions.

## Verification

TypeScript compilation: `npx tsc --noEmit` — zero errors (after clearing stale .next/dev/types/ per MEM051 gotcha).

Test suite: `npx vitest run` — all 71 tests across 4 test files passed (392ms). 9 new categorize-orders tests all green, 62 existing tests unregressed.

Slice-level verification (partial — this is T02 of 2): Console log patterns from disconnection banner state transitions present in implementation. useNotification logs verified in T01. All timer cleanup verified via useEffect returns.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass (zero src/ errors after clearing stale .next/dev/types) | 8000ms |
| 2 | `npx vitest run` | 0 | ✅ pass (71 tests, 4 files, 0 failures — 9 new categorize-orders tests) | 392ms |

## Deviations

None. Implementation followed the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `src/lib/categorize-orders.ts`
- `src/lib/__tests__/categorize-orders.test.ts`
- `src/components/staff/StationView.tsx`
- `src/app/globals.css`
