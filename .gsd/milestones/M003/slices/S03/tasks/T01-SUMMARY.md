---
id: T01
parent: S03
milestone: M003
key_files:
  - src/components/staff/useNotification.ts
  - src/components/staff/useOrderStream.ts
  - src/components/staff/StationView.tsx
  - src/components/staff/OrderCard.tsx
  - src/app/globals.css
key_decisions:
  - Used ref-based callback stabilization (onNewOrderRef) in useOrderStream to prevent SSE reconnection when notification callback identity changes
  - Used inline Web Audio API oscillators (A5→C#6 sine waves) rather than external audio files — zero dependencies, works offline
  - Applied transition-shadow instead of transition-all on OrderCard per interface guidelines
duration: 
verification_result: passed
completed_at: 2026-05-06T06:28:58.232Z
blocker_discovered: false
---

# T01: Added Web Audio API notification chime with mute toggle, autoplay unlock prompt, and amber pulse-highlight on new OrderCards

**Added Web Audio API notification chime with mute toggle, autoplay unlock prompt, and amber pulse-highlight on new OrderCards**

## What Happened

Implemented the full notification system across five files:

1. **Created `useNotification.ts`** — New hook exposing `{ playChime, isMuted, toggleMute, needsUnlock, unlock }`. Uses Web Audio API `AudioContext` + `OscillatorNode` to generate a two-tone chime (A5→C#6, ~300ms total). Mute state persists to `localStorage('staff-notification-mute')`. On mount, detects if AudioContext is in `suspended` state (browser autoplay policy) and sets `needsUnlock=true`. The `unlock` function resumes the AudioContext — must be called inside a user gesture handler. All state changes log with `[useNotification]` prefix (Chime played, Muted, Unmuted, AudioContext unlocked).

2. **Modified `useOrderStream.ts`** — Added optional `UseOrderStreamOptions` with `onNewOrder?: (order: Order) => void` callback. Used a ref (`onNewOrderRef`) to stabilize the callback reference so the SSE `useEffect` doesn't re-run when the callback identity changes. The callback fires only for station-relevant orders (after `filterOrderForStation` passes). Existing consumers that don't pass options are unaffected — fully backward-compatible.

3. **Modified `StationView.tsx`** — Wired `useNotification` into the component. The `handleNewOrder` callback plays the chime (unless muted) and adds the order ID to a `newOrderIds` Set for visual tracking. A 5-second `setTimeout` per order clears its highlight. All timers are cleaned up on unmount via a `Map<number, Timer>` ref. Header now shows: (a) "🔔 Bật thông báo" unlock button when AudioContext needs user gesture, (b) 🔔/🔕 mute toggle when unlocked, both with ≥44px touch targets. `isNew` prop passed to each `OrderCard`.

4. **Modified `OrderCard.tsx`** — Accepts optional `isNew?: boolean` prop. When true, adds `animate-pulse-highlight` class to the card's outer `div`. Changed `transition-all` to `transition-shadow` on the card (per "never use transition: all" guideline).

5. **Modified `globals.css`** — Added `@keyframes pulse-highlight` with amber glow (box-shadow + background-color cycling) and `.animate-pulse-highlight` utility class (3 cycles at 0.66s each = ~2s total). Also added `-webkit-font-smoothing: antialiased` to body for crisper text on macOS.

## Verification

TypeScript compilation: `npx tsc --noEmit` — zero errors in `src/` (only pre-existing `.next/dev/types/validator.ts` route-type warnings unrelated to this change).

Test suite: `npx vitest run` — all 62 tests across 3 test files passed (346ms total). No regressions.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass (zero src/ errors, only pre-existing .next route-type warnings) | 8000ms |
| 2 | `npx vitest run` | 0 | ✅ pass (62 tests, 3 files, 0 failures) | 346ms |

## Deviations

Changed OrderCard's `transition-all` to `transition-shadow` per 'never use transition: all' design guideline — minor improvement not in original plan.

## Known Issues

None.

## Files Created/Modified

- `src/components/staff/useNotification.ts`
- `src/components/staff/useOrderStream.ts`
- `src/components/staff/StationView.tsx`
- `src/components/staff/OrderCard.tsx`
- `src/app/globals.css`
