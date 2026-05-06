---
estimated_steps: 31
estimated_files: 3
skills_used: []
---

# T02: Sticky Cart Bar + Slide-Up Cart Sheet

Build the sticky bottom bar and slide-up cart sheet with full cart management UI.

**Steps:**
1. Create `src/components/order/CartBar.tsx` as a Client Component:
   - Reads cart state from useCart() hook
   - Fixed to bottom of viewport (position: fixed, bottom: 0)
   - Shows: item count badge, total in VND format, 'Xem giỏ hàng' text
   - Hidden when cart is empty (animate out with translateY)
   - Tap opens the cart sheet
   - Amber gradient background matching M001 button style
   - z-index: 30
   - min-height: 48px, safe-area-inset-bottom padding for notched phones
2. Create `src/components/order/CartSheet.tsx` as a Client Component:
   - Slide-up overlay sheet (translateY transition, CSS transforms only for perf)
   - Semi-transparent backdrop (no blur — perf concern on low-end Android)
   - z-index: 40 (above cart bar)
   - Content: scrollable list of cart items, each with:
     - Item name + unit price
     - Quantity controls: – / qty / + buttons (min-height 48px hit areas)
     - 'Ghi chú' text field per item (free text, e.g. 'ít đường, nhiều đá')
     - Subtotal per item (price × qty) in VND
     - Remove item button
   - Grand total at bottom with tabular-nums
   - 'Gửi đơn' submit button (amber gradient, scale-on-press)
   - Close button / swipe-down to close (or tap backdrop)
3. Wire CartBar and CartSheet into the order page (render below MenuView)
4. Follow design principles:
   - Concentric border radius on sheet (outer = inner + padding)
   - Layered shadows on sheet
   - Interruptible CSS transitions (not keyframes) for sheet open/close
   - Specific transition properties (not transition: all)
   - will-change: transform on sheet element

## Inputs

- `src/components/order/CartProvider.tsx (cart state from T01)`
- `src/lib/format.ts (VND formatter from S01)`
- `src/app/page.tsx (visual language reference for gradients, shadows)`

## Expected Output

- `src/components/order/CartBar.tsx`
- `src/components/order/CartSheet.tsx`
- `src/app/order/page.tsx (updated with CartBar + CartSheet)`

## Verification

- `next build` completes without type errors
- Navigate to /order?table=5 at 375px viewport
- Add items → cart bar appears at bottom with count + total
- Tap cart bar → sheet slides up with item list
- Adjust quantities with +/– buttons
- Add notes to items
- Remove an item
- Tap backdrop or close → sheet slides down
- Cart bar hidden when cart is empty
- All text in Vietnamese
