# S03: Notifications & Auto-Hide Polish — UAT

**Milestone:** M003
**Written:** 2026-05-06T06:36:42.397Z

# S03: Notifications & Auto-Hide Polish — UAT

**Milestone:** M003
**Written:** 2026-05-06

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: Features exercise real SSE events, browser Audio API, timer-based state management, and localStorage persistence — all require a running dev server and browser to verify.

## Preconditions

- Dev server running: `npm run dev` at localhost:3000
- Database seeded with menu items and tables
- At least one active order exists (submit via `/order?table=1`)
- Browser with Web Audio API support (Chrome/Edge/Firefox)

## Smoke Test

Open `/staff/bar` in a browser tab. Submit a new order containing drinks via `/order?table=2` in another tab. Within 3 seconds, the bar station should show the new order with an amber pulsing highlight and play a two-tone chime sound.

## Test Cases

### 1. New order notification chime

1. Open `/staff/bar` in a browser tab
2. If "🔔 Bật thông báo" unlock button appears, tap it once
3. Open `/order?table=3` in another tab and submit an order with drink items
4. **Expected:** Bar station shows new order within 3 seconds. A two-tone chime plays. The new OrderCard has an amber pulsing glow for ~2 seconds, then returns to normal.

### 2. Mute toggle persists across reload

1. On `/staff/bar`, tap the 🔔 icon to mute (should show 🔕)
2. Submit another order from customer tab
3. **Expected:** New order appears with amber pulse highlight but NO chime plays
4. Reload the `/staff/bar` page
5. **Expected:** Mute state is preserved (shows 🔕), new orders still don't chime
6. Tap 🔕 to unmute, submit another order
7. **Expected:** Chime plays again

### 3. AudioContext unlock prompt

1. Open `/staff/kitchen` in a fresh browser tab (clear localStorage first)
2. **Expected:** "🔔 Bật thông báo" unlock button appears in the header
3. Tap the button
4. **Expected:** Button replaced by 🔔/🔕 mute toggle. Console shows `[useNotification] AudioContext unlocked`

### 4. Auto-hide completed orders after 5 minutes

1. On `/staff/bar`, advance a drink item through PENDING → PREPARING → READY
2. On `/staff` overview, mark the order SERVED
3. **Expected:** On bar station, the order moves to a "Đã xong" greyed-out section (opacity reduced, desaturated)
4. Wait 5 minutes (or adjust system clock)
5. **Expected:** The order disappears from view entirely

### 5. Lịch sử toggle reveals hidden orders

1. After step 4 above (order auto-hidden), check header for "Lịch sử (N)" button where N ≥ 1
2. Tap "Lịch sử" button
3. **Expected:** Hidden orders appear in a "Lịch sử" section at the bottom, greyed out
4. Tap "Lịch sử" again to hide
5. **Expected:** Hidden section collapses

### 6. Disconnection banner appears after 3 seconds

1. Open `/staff/bar` with active SSE connection
2. Stop the dev server (Ctrl+C)
3. Wait 3 seconds
4. **Expected:** Amber/red banner appears: "⚠️ Mất kết nối — Đang kết nối lại..." with a "Tải lại" button
5. Console shows `[StationView] Disconnection banner shown`

### 7. Reconnection success banner

1. With disconnection banner showing, restart the dev server (`npm run dev`)
2. Wait for SSE to auto-reconnect
3. **Expected:** Disconnection banner disappears. Brief green banner "✅ Đã kết nối lại" appears for 2 seconds, then auto-hides
4. Console shows `[StationView] Reconnection banner shown` then `[StationView] Reconnection banner hidden`

### 8. Kitchen and Overview stations also get notifications

1. Open `/staff/kitchen` — submit order with food items
2. **Expected:** Same chime + pulse behavior as bar station
3. Open `/staff` overview — submit any order
4. **Expected:** Same chime + pulse behavior

## Edge Cases

### Multiple rapid orders

1. Submit 3 orders in quick succession from different tables
2. **Expected:** Each triggers its own chime (may overlap), each card gets amber pulse independently

### Muted new order still highlights visually

1. Mute notifications (🔕), submit a new order
2. **Expected:** Amber pulse highlight still appears — only audio is silenced

### Tải lại button during disconnection

1. With disconnection banner showing, tap "Tải lại"
2. **Expected:** Page triggers a data refetch attempt. If server is still down, banner remains.

## Failure Signals

- No chime sound on new orders (check browser console for AudioContext errors)
- No amber pulse on new OrderCards (check for `animate-pulse-highlight` class in DOM)
- Completed orders never disappear (check 30-second bucketTick interval firing)
- Disconnection banner never appears despite server being down (check SSE connectionStatus state)
- "Lịch sử" button shows count of 0 when completed orders should exist

## Not Proven By This UAT

- Exact 5-minute auto-hide timing precision (difficult to test manually without time manipulation)
- Performance under high order volume (100+ simultaneous orders)
- Audio behavior across all browser/OS combinations (only tested on primary dev browser)
- SSE reconnection under intermittent network conditions (only tested server stop/start)
- Multi-tab notification deduplication (each tab plays its own chime independently)

## Notes for Tester

- The AudioContext unlock prompt only appears on first visit or after clearing localStorage. Subsequent visits with an existing mute preference skip the prompt.
- The 30-second bucket tick means orders may take up to 30 seconds after the 5-minute mark to actually auto-hide from the UI.
- The pulse-highlight animation runs for ~2 seconds (3 cycles × 0.66s). It's intentionally short.
- All touch targets are ≥44px per accessibility guidelines.
- Console `[useNotification]` and `[StationView]` log prefixes are the authoritative diagnostic signals.
