# S02: Cart + Order Submission — Full Ordering Flow

**Goal:** Customer adds menu items to a cart with quantities and notes, reviews in a slide-up sheet, submits the order to the database, sees a confirmation, and can return to order more items — creating separate Order records per submission.
**Demo:** Customer on /order?table=5 taps items → sticky bottom bar appears with count + total → taps bar → slide-up cart sheet with qty +/-, notes per item, subtotals → adds 'ít đường' note → taps 'Gửi đơn' → Order + OrderItems created in DB with correct FKs and server-computed total → confirmation screen → taps 'Gọi thêm món' → back to menu → submits second order → two separate Order records in DB.

## Must-Haves

- Adding items shows sticky bottom bar with item count and VND total
- Cart sheet slides up with qty +/-, notes field, subtotals, grand total
- 'Gửi đơn' creates Order + OrderItems with correct tableId, menuItemId, quantity, notes
- Server re-computes totalAmount from DB prices (never trusts client)
- API rejects: invalid table, non-existent menuItemId, unavailable items, zero/negative quantity
- Confirmation screen shows order summary with table number
- 'Gọi thêm món' returns to menu — second submission creates separate Order record
- Cart persists across page refresh via sessionStorage
- Cart sheet usable at 375px viewport width
- next build completes without type errors

## Proof Level

- This slice proves: integration — full flow with real DB writes verified via Prisma queries

## Integration Closure

S02 completes the customer write path. M002 is fully closed — Order + OrderItem records are in the DB with status PENDING, ready for M003's staff dashboard to read.

## Verification

- None — order creation is synchronous with immediate success/error feedback. No background processes.

## Tasks

- [x] **T01: Cart State Provider with sessionStorage Persistence** `est:30 min`
  Create the CartProvider context with useReducer for cart state management and sessionStorage persistence.
  - Files: `src/components/order/CartProvider.tsx`, `src/components/order/MenuView.tsx`, `src/app/order/page.tsx`
  - Verify: - `next build` completes without type errors
- Navigate to /order?table=5, tap an item card → item added to cart state (verify via React DevTools or by checking sessionStorage)
- Refresh page → cart state restored from sessionStorage
- Tap same item again → quantity increments
- Different table (/order?table=3) has independent cart

- [x] **T02: Sticky Cart Bar + Slide-Up Cart Sheet** `est:45 min`
  Build the sticky bottom bar and slide-up cart sheet with full cart management UI.
  - Files: `src/components/order/CartBar.tsx`, `src/components/order/CartSheet.tsx`, `src/app/order/page.tsx`
  - Verify: - `next build` completes without type errors
- Navigate to /order?table=5 at 375px viewport
- Add items → cart bar appears at bottom with count + total
- Tap cart bar → sheet slides up with item list
- Adjust quantities with +/– buttons
- Add notes to items
- Remove an item
- Tap backdrop or close → sheet slides down
- Cart bar hidden when cart is empty
- All text in Vietnamese

- [ ] **T03: Order Creation API + Submission + Confirmation** `est:45 min`
  Build the POST /api/order Route Handler, wire cart submission, and build the confirmation screen.
  - Files: `src/app/api/order/route.ts`, `src/components/order/CartSheet.tsx`, `src/components/order/OrderConfirmation.tsx`, `src/app/order/page.tsx`
  - Verify: - `next build` completes without type errors
- POST /api/order with valid payload → 201, Order + OrderItems in DB with correct FKs
- POST /api/order with invalid tableId → 404
- POST /api/order with unavailable menuItemId → 409
- POST /api/order with quantity 0 or negative → 400
- Full UI flow at 375px: add items → open cart → add notes → submit → confirmation shows
- Tap 'Gọi thêm món' → back to menu → submit another order → two separate Order records in DB
- Server-computed totalAmount matches expected sum of (price × qty)
- Cart cleared after successful submission
- Error toast on submission failure with cart preserved

## Files Likely Touched

- src/components/order/CartProvider.tsx
- src/components/order/MenuView.tsx
- src/app/order/page.tsx
- src/components/order/CartBar.tsx
- src/components/order/CartSheet.tsx
- src/app/api/order/route.ts
- src/components/order/OrderConfirmation.tsx
