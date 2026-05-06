# S03 — Notifications & Auto-Hide Polish — Research

**Date:** 2025-07-17
**Depth:** Light — UI polish using standard browser APIs on an established foundation

## Summary

S03 adds three UX polish features to the existing staff dashboard: (1) notification chime + pulsing highlight on new orders, (2) auto-hide completed items after 5 minutes with "Lịch sử" toggle, (3) SSE disconnection banner. All three features layer on top of S01's `useOrderStream` hook and `StationView` component. No API changes needed. The only technical nuance is browser audio autoplay policy — modern browsers block `Audio.play()` until a user gesture has unlocked the AudioContext.

## Requirements Targeted

- **R003** (supports) — "Dashboard updates automatically via EventSource" is already delivered. S03 adds the UX signals (sound, visual flash) that make real-time updates noticeable in a noisy kitchen/bar environment.

## Recommendation

**Approach: Three independent features, each modifying existing components.**

1. **Notification system** — Create a `useNotification` hook (or `NotificationProvider` context) that listens for `new-order` events from `useOrderStream` and plays a chime + triggers pulsing CSS animation on the new order card. Include mute toggle in the station header and audio unlock prompt.
2. **Auto-hide** — Modify `StationView` to track when items become SERVED/CANCELLED (timestamp), auto-hide them after 5 minutes via `setTimeout`/`setInterval`, and add a "Lịch sử" toggle button to reveal hidden items.
3. **Disconnection banner** — `useOrderStream` already exposes `connectionStatus`. Add a banner in `StationView` when status is `'error'` or `'disconnected'` for >3 seconds.

All three are independent and can be built in parallel. None require API changes.

## Implementation Landscape

### Existing Files to Modify

| File | Current State | S03 Change |
|------|--------------|------------|
| `src/components/staff/StationView.tsx` | Renders header + order grid. Filters SERVED/CANCELLED. Has connection status dot. | Add: disconnection banner, auto-hide logic, "Lịch sử" toggle, notification mute toggle in header |
| `src/components/staff/OrderCard.tsx` | Static card rendering. | Add: pulsing highlight CSS class for new orders (via prop `isNew`) |
| `src/components/staff/useOrderStream.ts` | Manages SSE connection and order state. Dispatches ADD_ORDER/UPDATE_ORDER. | Add: track `isNew` flag on orders for notification trigger, or expose an `onNewOrder` callback |
| `src/app/globals.css` | Tailwind import + amber theme vars. | Add: `@keyframes pulse-highlight` animation for new order cards |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/staff/useNotification.ts` | Hook managing audio playback, mute state (localStorage), autoplay unlock detection |
| `public/sounds/new-order.mp3` | Notification chime audio file (short, pleasant, royalty-free) |

### Feature 1: Notification Chime + Visual Highlight

**Audio approach:**
```typescript
// useNotification.ts
const audio = new Audio('/sounds/new-order.mp3')
audio.play().catch(() => {
  // Autoplay blocked — need user gesture to unlock
  setNeedsUnlock(true)
})
```

**Autoplay unlock pattern:**
- On first visit, if `audio.play()` rejects with `NotAllowedError`, show a "🔔 Bật thông báo" button in the header
- When user taps the button, call `audio.play()` inside the click handler (user gesture unlocks AudioContext)
- Store unlock state in a ref — don't need localStorage since AudioContext resets on page load anyway

**Mute toggle:**
- Store mute preference in `localStorage('staff-notification-mute')`
- Toggle button in station header: 🔔 (unmuted) / 🔕 (muted)
- When muted, skip `audio.play()` but still show visual highlight

**Visual highlight:**
- When `useOrderStream` dispatches `ADD_ORDER`, mark the order with `isNew: true` and a timestamp
- OrderCard receives `isNew` prop → applies `animate-pulse-highlight` class (amber glow + scale)
- After 5 seconds, remove `isNew` flag (via setTimeout in the hook)
- CSS animation: 3-4 pulses of amber background glow, then settles

**Integration point with useOrderStream:**
- Option A: Add `isNew` field to Order type in reducer state, set on ADD_ORDER, clear after timeout
- Option B: Separate `newOrderIds: Set<number>` state tracked alongside orders
- Option A is cleaner — modify the reducer to tag new orders

### Feature 2: Auto-Hide Completed Items

**Current behavior:** `StationView` filters out SERVED/CANCELLED orders entirely:
```typescript
const activeOrders = orders.filter((o) => {
  const s = o.derivedStatus ?? o.status
  return s !== 'SERVED' && s !== 'CANCELLED'
})
```

**New behavior:**
- Track when an order transitions to SERVED or CANCELLED (timestamp)
- For the first 5 minutes after completion, show the order in a "recently completed" section (greyed out)
- After 5 minutes, move to "hidden" list
- "Lịch sử" toggle button reveals all hidden orders

**Implementation:**
- Add `completedAt` timestamp tracking in the hook (Map<orderId, timestamp>)
- In StationView, split orders into three buckets:
  1. Active orders (not SERVED/CANCELLED) — displayed normally
  2. Recently completed (SERVED/CANCELLED within last 5 minutes) — displayed greyed out with "Đã xong" label
  3. Hidden (SERVED/CANCELLED older than 5 minutes) — only shown when "Lịch sử" toggle is active
- Use `setInterval` every 30 seconds to re-evaluate which orders move from "recently completed" to "hidden"
- "Lịch sử" button with count badge: `Lịch sử (${hiddenCount})`

**Note:** The current GET endpoint filters out SERVED/CANCELLED orders server-side. This means on page load, no completed orders are returned. Auto-hide only applies to orders that transition to completed WHILE the page is open. This is acceptable — staff don't need historical orders from before their shift started.

### Feature 3: Disconnection Banner

**Current state:** `useOrderStream` tracks `connectionStatus` ('connecting' | 'connected' | 'disconnected' | 'error'). `StationView` shows a small connection status dot in the header.

**Enhancement:**
- When `connectionStatus` is `'error'` for more than 3 seconds, show a full-width amber/red banner below the header: "⚠️ Mất kết nối — Đang kết nối lại... [Tải lại]"
- Use a timer — don't flash the banner on brief reconnections
- When connection restores to `'connected'`, briefly show green "✅ Đã kết nối lại" banner for 2 seconds, then hide
- "Tải lại" button calls `refetch()` from useOrderStream

**Implementation:** Add state in StationView:
```typescript
const [showBanner, setShowBanner] = useState(false)
useEffect(() => {
  if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
    const timer = setTimeout(() => setShowBanner(true), 3000)
    return () => clearTimeout(timer)
  } else {
    setShowBanner(false)
  }
}, [connectionStatus])
```

### Natural Seams for Task Decomposition

1. **Notification system** (useNotification hook + OrderCard highlight + header mute toggle)
   - Create useNotification.ts hook
   - Source/create notification chime audio file
   - Modify useOrderStream to tag new orders with isNew flag
   - Modify OrderCard to accept and display isNew highlight
   - Modify StationView header to add mute toggle + unlock prompt
   - Verify: submit order → hear chime + see pulse → tap mute → no chime on next order

2. **Auto-hide completed items** (StationView logic + UI)
   - Add completedAt tracking to useOrderStream or StationView
   - Split order list into active / recently completed / hidden buckets
   - Add "Lịch sử" toggle with count badge
   - Add visual distinction for recently completed orders (greyed, smaller)
   - Verify: advance all items to SERVED → order greys out → after 5 min → disappears → tap Lịch sử → reappears

3. **Disconnection banner** (StationView enhancement)
   - Add banner component with timer logic
   - Show reconnection success briefly
   - Verify: stop SSE (kill dev server) → banner appears after 3s → restart → banner clears

### Audio File Strategy

Need a short (0.5-1s) pleasant notification chime. Options:
- Generate programmatically using Web Audio API (AudioContext.createOscillator) — no file needed, but less pleasant
- Use a free sound from a royalty-free library
- Create a minimal base64-encoded audio inline — avoids file management but increases bundle

**Recommendation:** Create a simple two-tone chime using Web Audio API oscillator in the hook itself. No external file dependency, works offline, ~20 lines of code. If the sound quality isn't pleasant enough, swap for an MP3 file later.

```typescript
function playChime() {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
  osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1) // ~C#6
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.3)
}
```

This avoids the `public/sounds/new-order.mp3` file entirely. AudioContext still requires user gesture to create in most browsers, so the unlock flow remains the same.

### Constraints

- No API changes — all features are client-side only
- `useOrderStream` hook is the integration point for all three features
- Browser audio autoplay policy is the only non-trivial constraint — solved with the unlock prompt pattern
- Auto-hide timers must be cleaned up on component unmount to prevent memory leaks
- All UI text must be Vietnamese
- Touch targets must be ≥44px for tablet use

### Verification Strategy

- `npx tsc --noEmit` — TypeScript compiles cleanly
- `npx vitest run` — existing tests still pass
- Dev server: Submit new order → hear notification chime (or see unlock prompt if first visit)
- Dev server: Tap mute toggle → submit another order → no chime but visual highlight still shows
- Dev server: Advance all items to READY/SERVED → order greys out → wait 5 min (or lower timer for testing) → order disappears → tap "Lịch sử" → order reappears
- Dev server: Kill and restart dev server → disconnection banner appears within ~3s → on reconnect, brief success banner → orders re-sync
