---
estimated_steps: 17
estimated_files: 5
skills_used: []
---

# T01: Add notification chime with visual pulse and mute toggle

Create the notification system: a `useNotification` hook that plays a two-tone chime via Web Audio API on new orders, a pulsing amber highlight on new OrderCards, and a mute toggle in the StationView header with localStorage persistence. Handle browser autoplay policy by detecting AudioContext lock and showing an unlock prompt.

## Steps

1. **Create `src/components/staff/useNotification.ts`** — Export a hook returning `{ playChime, isMuted, toggleMute, needsUnlock, unlock }`. Use Web Audio API `AudioContext` + `OscillatorNode` to generate a pleasant two-tone chime (~0.3s, A5→C#6). Store mute preference in `localStorage('staff-notification-mute')`. Detect autoplay lock: on mount, try creating an AudioContext — if it's in 'suspended' state, set `needsUnlock=true`. The `unlock` function resumes the AudioContext inside a user gesture handler. Log `[useNotification]` for chime/mute/unlock events.

2. **Modify `src/components/staff/useOrderStream.ts`** — Add an optional `onNewOrder?: (order: Order) => void` parameter to `useOrderStream(station, options?)`. In the `new-order` SSE event handler, after dispatching `ADD_ORDER` and filtering for station, call `onNewOrder?.(filtered)` if the order is relevant. This is the integration point — StationView will pass the notification callback here.

3. **Modify `src/components/staff/StationView.tsx` header** — Wire notification into StationView: call `useNotification()`, pass `onNewOrder` callback to `useOrderStream` that calls `playChime()` and adds the order ID to a `newOrderIds` Set (React state). Set a 5-second `setTimeout` per new order to remove its ID from the set (clear on unmount). Add mute toggle button (🔔/🔕) in the header next to the connection status indicator — min 44px touch target, toggles `isMuted`. When `needsUnlock` is true, show a "🔔 Bật thông báo" button that calls `unlock()`. Pass `isNew={newOrderIds.has(order.id)}` to each `OrderCard`.

4. **Modify `src/components/staff/OrderCard.tsx`** — Accept optional `isNew?: boolean` prop. When true, apply `animate-pulse-highlight` CSS class to the card's outer div (additive to existing classes). The animation is a 3-pulse amber glow that settles after ~2 seconds.

5. **Add CSS keyframes to `src/app/globals.css`** — Define `@keyframes pulse-highlight` with amber background glow (amber-200 → transparent) cycling 3 times over 2 seconds. Define utility class `.animate-pulse-highlight` with `animation: pulse-highlight 0.66s ease-in-out 3`.

## Must-Haves

- [ ] Web Audio API chime works without external audio files — two-tone oscillator, ~0.3s duration
- [ ] Mute state persists in localStorage across page reloads
- [ ] AudioContext autoplay lock detected and unlock prompt shown
- [ ] Visual pulse on new OrderCards lasts ~2 seconds (3 cycles) then stops
- [ ] `onNewOrder` callback fires only for station-relevant orders (not all SSE events)
- [ ] All new UI text in Vietnamese
- [ ] Touch targets ≥44px for mute toggle and unlock button
- [ ] Timer cleanup on component unmount (no memory leaks)
- [ ] Existing useOrderStream consumers (all station pages) continue working without passing the new option

## Inputs

- ``src/components/staff/useOrderStream.ts` — existing hook to add onNewOrder callback to`
- ``src/components/staff/StationView.tsx` — existing component to wire notification into header`
- ``src/components/staff/OrderCard.tsx` — existing component to add isNew pulse prop`
- ``src/app/globals.css` — existing CSS to add keyframes to`

## Expected Output

- ``src/components/staff/useNotification.ts` — new hook with playChime, isMuted, toggleMute, needsUnlock, unlock`
- ``src/components/staff/useOrderStream.ts` — modified with onNewOrder callback parameter`
- ``src/components/staff/OrderCard.tsx` — modified with isNew prop and pulse-highlight class`
- ``src/components/staff/StationView.tsx` — modified header with mute toggle, unlock prompt, newOrderIds tracking`
- ``src/app/globals.css` — modified with pulse-highlight keyframes and utility class`

## Verification

npx tsc --noEmit && npx vitest run
