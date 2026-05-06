---
id: T02
parent: S02
milestone: M002
key_files:
  - src/components/order/CartBar.tsx
  - src/components/order/CartSheet.tsx
  - src/components/order/CartUI.tsx
  - src/app/order/page.tsx
key_decisions:
  - Created CartUI.tsx thin wrapper to manage isOpen state — keeps page.tsx as a server component while CartBar/CartSheet are client components
  - Adapted to T01's actual CartProvider interface (payload wrappers, state.items) rather than the originally planned flat interface
  - Used cubic-bezier(0.32, 0.72, 0, 1) spring-like curve for sheet slide animation for natural feel
  - Drag indicator doubles as close button for accessibility — single element, dual purpose
duration: 
verification_result: passed
completed_at: 2026-05-06T04:25:50.077Z
blocker_discovered: false
---

# T02: Built sticky cart bar with animated show/hide and slide-up cart sheet with full item management UI

**Built sticky cart bar with animated show/hide and slide-up cart sheet with full item management UI**

## What Happened

Created three new client components for the cart UI layer:

1. **CartBar.tsx** — A sticky bottom bar fixed to the viewport with `z-index: 30`. Shows item count badge, total in VND format, and 'Xem giỏ hàng' label. Uses amber gradient background matching M001 button style. Animates in/out via `translateY` with `will-change: transform`. Includes `safe-area-inset-bottom` padding for notched phones. Hidden with `pointerEvents: none` and `tabIndex: -1` when cart is empty.

2. **CartSheet.tsx** — A slide-up overlay sheet at `z-index: 40` with semi-transparent backdrop (no blur for low-end device perf). Features:
   - Scrollable cart item list with name, unit price, quantity controls (–/qty/+), per-item notes field ('Ghi chú'), subtotal, and remove button
   - All touch targets ≥48px min-height
   - Concentric border radius (outer=24px = inner 16px + 8px padding)
   - Layered shadows on the sheet
   - Interruptible CSS transition using `cubic-bezier(0.32, 0.72, 0, 1)` for natural spring feel
   - Specific `transitionProperty` declarations (never `transition: all`)
   - `will-change: transform` on sheet element
   - Escape key closes, body scroll locked when open
   - Grand total with `tabular-nums`, 'Gửi đơn' submit button (placeholder — T03 wires logic)
   - All labels in Vietnamese

3. **CartUI.tsx** — Thin client wrapper managing `isOpen` state for the sheet. Allows the server-component page.tsx to render CartBar + CartSheet without needing to be a client component itself.

4. **order/page.tsx** — Added CartUI import and rendered it inside the existing CartProvider (placed by T01), below MenuView.

Adapted to T01's actual CartProvider interface which uses `payload` wrapper objects for action discriminated unions and exposes `state.items` rather than a flat `items` property.

## Verification

Ran `npx next build` — compiled successfully with TypeScript check passing, no type errors. All routes generated without issues. Build completed in ~10s.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx next build` | 0 | ✅ pass | 10000ms |

## Deviations

CartProvider interface differs from task plan specification: uses `payload` wrapper objects (e.g., `{ type: 'REMOVE_ITEM', payload: { menuItemId } }`) instead of flat action shapes (e.g., `{ type: 'REMOVE_ITEM', menuItemId }`). Hook returns `state.items` via context value instead of flat `items`. Components adapted accordingly.

## Known Issues

None.

## Files Created/Modified

- `src/components/order/CartBar.tsx`
- `src/components/order/CartSheet.tsx`
- `src/components/order/CartUI.tsx`
- `src/app/order/page.tsx`
