---
id: S03
parent: M003
milestone: M003
provides:
  - ["Notification system (useNotification hook) for new order audio/visual alerts", "Three-bucket order lifecycle display with auto-hide and Lịch sử toggle", "SSE disconnection/reconnection banner UX", "Complete M003 staff dashboard feature set"]
requires:
  - slice: S01
    provides: useOrderStream hook, StationView component, OrderCard component, SSE infrastructure
  - slice: S02
    provides: Kitchen/Overview stations, cancel flow, StaffNav layout
affects:
  []
key_files:
  - ["src/components/staff/useNotification.ts", "src/components/staff/useOrderStream.ts", "src/components/staff/StationView.tsx", "src/components/staff/OrderCard.tsx", "src/app/globals.css", "src/lib/categorize-orders.ts", "src/lib/__tests__/categorize-orders.test.ts"]
key_decisions:
  - ["Web Audio API OscillatorNode for chimes (zero external audio deps, works offline)", "Ref-based callback stabilization (onNewOrderRef) to prevent SSE reconnection on callback identity change", "categorizeOrders as pure function with injectable time params for testability", "completedAtRef Map + 30s bucketTick interval for time-based bucket re-evaluation", "max-h + opacity CSS transition trick for animated banners without JS animation libraries", "transition-shadow instead of transition-all on OrderCard per design guidelines"]
patterns_established:
  - ["useNotification hook pattern: Web Audio API + localStorage mute persistence + AudioContext autoplay unlock", "Three-bucket order display: active / recentlyCompleted / hidden with time-based auto-transitions", "Pure function extraction for time-dependent logic with injectable time sources (categorizeOrders)", "3-second debounced disconnection detection with reconnection success banner"]
observability_surfaces:
  - ["Console logs: [useNotification] Chime played / Muted / Unmuted / AudioContext unlocked", "Console logs: [StationView] Disconnection banner shown / Reconnection banner shown / hidden", "Visual: SSE disconnection amber banner with Tải lại button", "Visual: Reconnection green success banner (2s auto-hide)"]
drill_down_paths:
  - [".gsd/milestones/M003/slices/S03/tasks/T01-SUMMARY.md", ".gsd/milestones/M003/slices/S03/tasks/T02-SUMMARY.md"]
duration: ""
verification_result: passed
completed_at: 2026-05-06T06:36:42.397Z
blocker_discovered: false
---

# S03: Notifications & Auto-Hide Polish

**Web Audio notification chime with mute toggle, three-bucket order display with auto-hide and Lịch sử toggle, and SSE disconnection/reconnection banners**

## What Happened

S03 delivered the final polish layer for the M003 Staff Dashboard — notification, lifecycle, and resilience features that complete the real-time order management experience.

**T01: Notification System** — Created `useNotification` hook using Web Audio API `OscillatorNode` to generate a two-tone chime (A5→C#6, ~300ms) on new orders. Zero external audio dependencies — works fully offline on local WiFi. Mute toggle persists to `localStorage('staff-notification-mute')`. Browser autoplay policy handled by detecting suspended `AudioContext` and showing an unlock prompt button (44px touch target). Modified `useOrderStream` with a ref-based callback stabilization pattern (`onNewOrderRef`) so the SSE `useEffect` doesn't re-run when the notification callback identity changes — prevents SSE reconnection churn. `StationView` wired to play chimes and track new order IDs for a 5-second amber pulse highlight via CSS `@keyframes pulse-highlight`. `OrderCard` accepts `isNew` prop for the highlight class. Also fixed `transition-all` → `transition-shadow` per design guidelines.

**T02: Auto-Hide & Connection Banners** — Created `categorizeOrders` as a pure function (injectable `now` and `hideAfterMs` for testability) that splits orders into three buckets: active, recentlyCompleted (within 5 min window), and hidden (past window). 9 unit tests cover all boundary conditions. `StationView` reworked: `completedAtRef` Map tracks when orders first become SERVED/CANCELLED, 30-second `bucketTick` interval forces re-evaluation without per-render Date.now() calls. Active orders render in main grid, recently completed render greyed/desaturated in "Đã xong" section, hidden orders behind "Lịch sử (N)" toggle button. Disconnection banner activates after 3 seconds of continuous SSE error via setTimeout debounce — shows "⚠️ Mất kết nối — Đang kết nối lại..." with "Tải lại" button. Reconnection banner shows "✅ Đã kết nối lại" green banner for 2 seconds. All timers/intervals properly cleaned up on unmount.

## Verification

**TypeScript compilation:** `npx tsc --noEmit` — exit 0, zero errors.

**Test suite:** `npx vitest run` — 71 tests across 4 test files, all passed (411ms). Includes 9 new categorize-orders tests covering: active passthrough, recently-completed within window, hidden after >5min, first-seen completion, exact/near boundary conditions, mixed buckets, custom hideAfterMs, and empty input.

**File verification:** All 7 key files confirmed present — useNotification.ts (4255B), useOrderStream.ts (7125B), StationView.tsx (15855B), OrderCard.tsx (10287B), globals.css (1200B), categorize-orders.ts (1996B), categorize-orders.test.ts (5472B).

**Console log patterns verified in implementation:** `[useNotification]` prefix for Chime played / Muted / Unmuted / AudioContext unlocked. `[StationView]` prefix for Disconnection/Reconnection banner state transitions.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

OrderCard transition-all changed to transition-shadow per 'never use transition: all' design guideline — minor improvement over plan. Added -webkit-font-smoothing: antialiased to body in globals.css — not in plan but standard polish.

## Known Limitations

30-second bucket tick granularity means orders may take up to 30 seconds past the 5-minute mark to auto-hide. Each open browser tab plays its own notification chime independently (no cross-tab deduplication). Audio chime is a simple sine-wave oscillator — functional but basic.

## Follow-ups

None — S03 is the final slice in M003. The staff dashboard milestone is feature-complete.

## Files Created/Modified

- `src/components/staff/useNotification.ts` — New hook: Web Audio API chime, mute toggle with localStorage, AudioContext autoplay unlock
- `src/components/staff/useOrderStream.ts` — Added onNewOrder callback option with ref-based stabilization to prevent SSE reconnection
- `src/components/staff/StationView.tsx` — Major rework: notification wiring, three-bucket display, Lịch sử toggle, disconnection/reconnection banners
- `src/components/staff/OrderCard.tsx` — Added isNew prop for pulse-highlight class, fixed transition-all to transition-shadow
- `src/app/globals.css` — Added pulse-highlight keyframes, completed-orders-section opacity/desaturate styles, antialiased font smoothing
- `src/lib/categorize-orders.ts` — New pure function: categorizeOrders splits orders into active/recentlyCompleted/hidden buckets
- `src/lib/__tests__/categorize-orders.test.ts` — 9 unit tests for categorizeOrders covering all boundary conditions
