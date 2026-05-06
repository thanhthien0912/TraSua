# S02: Add Items from Bill — UAT

**Milestone:** M004
**Written:** 2026-05-06T08:15:13.845Z

# S02: Add Items from Bill — UAT

**Milestone:** M004
**Written:** 2026-05-06

## UAT Type

- UAT mode: mixed (artifact-driven for API validation + live-runtime for UI flow)
- Why this mode is sufficient: API validation chain has 14 unit tests covering all error paths. UI integration is build-verified and grep-confirmed. Full end-to-end flow requires a running server for manual verification.

## Preconditions

- `npx prisma db push` has been run (schema current)
- `npx prisma db seed` has been run (18 menu items + 15 tables seeded)
- Dev server running at localhost:3000 (`npm run dev`)
- At least one table has an unpaid order (submit an order from /order?table=1)

## Smoke Test

Navigate to /staff/checkout → tap a table with an unpaid order → on the bill detail view, tap '+ Thêm món' → verify the MenuPickerModal opens with menu items visible in DRINK/FOOD tabs.

## Test Cases

### 1. Open Menu Picker from Bill

1. Navigate to /staff/checkout
2. Tap a table that has unpaid orders
3. On the bill detail view, tap '+ Thêm món' button
4. **Expected:** Bottom-sheet modal slides up from bottom with dimmed backdrop. DRINK tab is active by default showing drink items with prices in VND format.

### 2. Switch Between DRINK/FOOD Tabs

1. With MenuPickerModal open, tap the 'FOOD' tab
2. **Expected:** Tab switches to show food items. Tap 'DRINK' again — switches back to drinks. Active tab is visually highlighted.

### 3. Unavailable Items Display

1. (Pre-condition: set a menu item's `available` to false in DB)
2. Open MenuPickerModal
3. **Expected:** Unavailable item shows greyed out with 'Hết hàng' badge and cannot be selected/tapped.

### 4. Select Item and Set Quantity

1. Open MenuPickerModal, tap on an available menu item
2. Use +/- buttons to set quantity to 3
3. **Expected:** Item is selected (visually highlighted), quantity shows 3, - button decrements, + button increments, quantity minimum is 1.

### 5. Submit Add Item — Happy Path

1. Select a menu item, set quantity to 2
2. Tap submit button ('Thêm' or equivalent)
3. **Expected:** Modal closes. Bill view refreshes automatically. New item appears in the bill with quantity 2 and correct price. Bill total updates to include the new item.

### 6. SSE Propagation to Stations

1. Open /staff/bar (or /staff/kitchen) in a separate browser tab
2. From checkout bill view, add a DRINK item (or FOOD item for kitchen)
3. **Expected:** The bar (or kitchen) station receives the new item via SSE within ~3 seconds without page refresh.

### 7. Add Item to Table with Multiple Orders

1. Ensure a table has 2+ unpaid orders (submit orders from /order?table=N twice)
2. Open bill for that table, tap '+ Thêm món', add an item
3. **Expected:** Item is added to the latest (most recent) unpaid order. Bill shows item under that order. Total aggregates correctly across all orders.

## Edge Cases

### PAID Order Guard (409)

1. Mark a table as paid via 'Đã thanh toán' on the bill
2. Attempt to add an item to that (now PAID) order via API: `POST /api/staff/orders/{orderId}/items` with valid body
3. **Expected:** 409 response with Vietnamese error message. Item is not created.

### Unavailable Menu Item Guard (409)

1. Set a menu item's `available` to false in DB
2. Attempt to add that item via API: `POST /api/staff/orders/{orderId}/items`
3. **Expected:** 409 response with unavailableItems array listing the item name.

### Invalid Quantity (400)

1. POST to add-item API with quantity: 0 or quantity: -1
2. **Expected:** 400 response with error message about invalid quantity.

### Invalid Order ID (404)

1. POST to add-item API with a non-existent orderId
2. **Expected:** 404 response.

### Dismiss Modal Without Submitting

1. Open MenuPickerModal, select an item
2. Tap outside the modal (on the dimmed backdrop) or navigate away
3. **Expected:** Modal closes with slide-down animation. No item is added. Bill remains unchanged.

## Failure Signals

- MenuPickerModal doesn't open when tapping '+ Thêm món' — check BillView state wiring
- Menu items don't load — check GET /api/staff/menu response
- Item added but bill total doesn't update — check calculateOrderTotal in transaction
- Station doesn't receive new item — check SSE broadcast of item-status-change event
- 409 error not shown to user — check MenuPickerModal error handling

## Not Proven By This UAT

- Performance under high concurrent add-item requests (load testing)
- Behavior when menu items are modified while the modal is open (stale data)
- Offline/disconnected behavior when adding items (relies on SSE reconnect for eventual consistency)
- Multi-user concurrent edits to the same bill (no optimistic locking)

## Notes for Tester

- The MenuPickerModal uses a single-item-at-a-time selection model — this is intentional for quick staff workflow, not a multi-item cart
- Exit animation uses a 200ms setTimeout before onClose — the modal may appear to linger briefly, this is by design
- The modal fetches the menu fresh each time it opens — no caching, so menu availability changes are reflected immediately
