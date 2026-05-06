# S02: Cart + Order Submission — Full Ordering Flow — UAT

**Milestone:** M002
**Written:** 2026-05-06T04:45:05.634Z

# S02: Cart + Order Submission — UAT

**Milestone:** M002
**Written:** 2026-05-06

## UAT Type

- UAT mode: mixed (artifact-driven build verification + live-runtime API and UI verification)
- Why this mode is sufficient: Order creation involves DB writes and client-side state — both the compilation correctness and runtime behavior were verified

## Preconditions

- `npm run dev` running at localhost:3000
- Database seeded with 18 menu items (12 DRINK, 6 FOOD) and 15 tables
- At least one menu item marked as `available: false` in seed data
- Browser DevTools accessible for sessionStorage inspection

## Smoke Test

Navigate to `http://localhost:3000/order?table=5` → tap a drink item → sticky cart bar appears at bottom showing "1" count and VND price → tap cart bar → slide-up sheet shows the item with quantity controls → tap "Gửi đơn" → confirmation screen displays "Đặt món thành công!" with order details.

## Test Cases

### 1. Add Items to Cart

1. Navigate to `/order?table=5`
2. Tap a drink item card (e.g., "Trà sữa trân châu")
3. **Expected:** Sticky cart bar appears at bottom with count "1" and item's VND price
4. Tap the same item again
5. **Expected:** Cart bar shows count "2" and doubled price
6. Switch to "Đồ ăn" tab, tap a food item
7. **Expected:** Cart bar shows count "3" and updated total

### 2. Cart Persistence via sessionStorage

1. With items in cart on `/order?table=5`, refresh the page
2. **Expected:** Cart bar reappears with same count and total — items restored from sessionStorage
3. Open `/order?table=3` in a new tab
4. **Expected:** Cart is empty for table 3 — independent sessionStorage key per table

### 3. Cart Sheet — Quantity Management

1. Tap the cart bar to open the slide-up sheet
2. **Expected:** Sheet slides up showing all items with name, unit price, qty +/- buttons, notes field, subtotals
3. Tap "+" on an item → quantity increments, subtotal updates
4. Tap "–" to reduce quantity to 1, then tap "–" again
5. **Expected:** Item removed from cart; if last item, sheet content updates accordingly
6. Tap backdrop or close indicator
7. **Expected:** Sheet slides down

### 4. Cart Sheet — Notes per Item

1. Open cart sheet with items
2. Type "ít đường" in the notes field for an item
3. Close sheet, reopen
4. **Expected:** Notes persisted and displayed
5. Submit order
6. **Expected:** Notes appear in confirmation screen and are stored in OrderItem.notes in DB

### 5. Order Submission — Happy Path

1. Add 2× "Trà sữa trân châu" (35,000₫) and 1× food item (40,000₫) to cart
2. Open cart sheet, tap "Gửi đơn"
3. **Expected:** Button text changes to "Đang gửi..." momentarily
4. **Expected:** Confirmation screen shows "Đặt món thành công!", Bàn 5, order ID, item list with quantities and notes, and correct total (110,000₫)
5. Check DB: Order record with status PENDING, totalAmount = 110000, correct tableId
6. Check DB: OrderItems with correct menuItemId, quantity, notes

### 6. Order More — Multiple Orders

1. On confirmation screen, tap "Gọi thêm món"
2. **Expected:** Returns to menu view, cart bar hidden (cart was cleared)
3. Add different items, submit again
4. **Expected:** New confirmation with new order ID
5. Check DB: Two separate Order records for the same table, each with their own OrderItems

### 7. Server-Side Total Computation

1. Submit an order via curl or UI
2. **Expected:** totalAmount in DB = Σ(menuItem.price × orderItem.quantity) computed from DB prices, not from any client-submitted total

### 8. Cart Sheet at 375px Viewport

1. Set browser viewport to 375px width (iPhone SE)
2. Navigate to `/order?table=5`, add items, open cart sheet
3. **Expected:** All elements visible, touch targets ≥48px, no horizontal overflow, notes field usable, "Gửi đơn" button fully visible

## Edge Cases

### 9. Invalid Table — POST /api/order

1. POST to `/api/order` with `tableId: 9999`
2. **Expected:** 404 response with "Bàn không tồn tại."

### 10. Unavailable Menu Item

1. POST to `/api/order` with a menuItemId that has `available: false`
2. **Expected:** 409 response with `unavailableItems` array containing the ID
3. In UI: affected item shows red outline and "Món này đã hết hàng" label; cart preserved

### 11. Invalid Quantity

1. POST to `/api/order` with `quantity: 0`
2. **Expected:** 400 response
3. POST with `quantity: -1`
4. **Expected:** 400 response

### 12. Empty Items Array

1. POST to `/api/order` with `items: []`
2. **Expected:** 400 response

### 13. Submission Failure — Error Handling

1. Simulate network error (e.g., disconnect server during submission)
2. **Expected:** Error message "Không gửi được đơn. Vui lòng thử lại." displayed; cart preserved for retry

## Not Proven By This UAT

- **Performance under load:** No concurrent order submission testing — single-user flow only
- **Real QR scan → order flow:** QR scanning hardware not tested; assumes URL entry equivalent
- **Network resilience:** sessionStorage persistence tested on refresh, but not on actual network drops mid-submission
- **Accessibility with screen readers:** ARIA labels present on cart bar, but no VoiceOver/TalkBack testing performed
- **Cross-browser:** Verified in Chromium only; Safari/Firefox mobile not tested
