# S02: Kitchen + Overview Stations + Item Cancellation — UAT

**Milestone:** M003
**Written:** 2026-05-06T06:20:06.300Z

# S02: Kitchen + Overview Stations + Item Cancellation — UAT

**Milestone:** M003
**Written:** 2026-05-06

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: All three station pages use the same StationView/OrderCard/useOrderStream architecture verified in S01. Backend cancel logic has 8 unit tests. TypeScript compilation validates all wiring. Live runtime testing requires seeded orders + running dev server which is deferred to milestone-level UAT.

## Preconditions

- `npx prisma db push` has been run (SQLite DB exists with schema)
- `npx prisma db seed` has been run (18 menu items: 12 DRINK, 6 FOOD, 15 tables)
- Dev server running: `npx next dev`
- At least one order exists with both DRINK and FOOD items (submit via `/order?table=1`)

## Smoke Test

Navigate to `/staff` — should see the overview page with all orders and a bottom navigation bar with three tabs (Quầy Bar / Bếp / Tổng quan). Tổng quan tab should be highlighted.

## Test Cases

### 1. Kitchen station shows only FOOD items

1. Submit an order containing both drinks and food via `/order?table=1`
2. Navigate to `/staff/kitchen`
3. **Expected:** Only FOOD items appear (e.g., Bánh tráng trộn, Gà rán). No DRINK items visible. Vietnamese title "TraSua - Bếp" in browser tab.

### 2. Bar station shows only DRINK items

1. With same order as above, navigate to `/staff/bar`
2. **Expected:** Only DRINK items appear (e.g., Trà sữa trân châu). No FOOD items visible.

### 3. Overview station shows all items from all orders

1. Navigate to `/staff` (overview)
2. **Expected:** All orders visible with all items regardless of category. Runner can tap items through READY → SERVED.

### 4. Navigation tabs work correctly

1. From any staff page, observe bottom navigation bar
2. Tap "Quầy Bar" → navigates to `/staff/bar`, tab highlighted
3. Tap "Bếp" → navigates to `/staff/kitchen`, tab highlighted
4. Tap "Tổng quan" → navigates to `/staff`, tab highlighted
5. **Expected:** Active tab shows amber indicator pill, correct route loads each time.

### 5. Cancel item with two-tap confirmation

1. On any station page, find an item with PENDING status
2. Tap the cancel button (red, subtle)
3. **Expected:** Button changes to solid red with text 'Xác nhận huỷ?'
4. Tap again within 3 seconds
5. **Expected:** Item status changes to CANCELLED (Huỷ badge). No more action buttons for that item.

### 6. Cancel confirmation auto-resets after 3 seconds

1. Tap cancel button on a PENDING item
2. Wait 3+ seconds without tapping again
3. **Expected:** Button reverts to initial subtle red state.

### 7. Cancel recalculates totalAmount

1. Order has 2 items: Trà sữa (40,000đ) + Bánh tráng (25,000đ) = 65,000đ total
2. Cancel Bánh tráng
3. **Expected:** Order totalAmount updates to 40,000đ. SSE broadcasts the updated total to all connected stations.

### 8. Cancel all items sets totalAmount to 0

1. Cancel all remaining items in an order
2. **Expected:** totalAmount becomes 0đ, order derivedStatus becomes CANCELLED.

### 9. SERVED and CANCELLED items have no cancel button

1. Advance an item to SERVED status
2. **Expected:** No cancel button visible for SERVED items
3. Cancel an item
4. **Expected:** No cancel button visible for CANCELLED items

## Edge Cases

### SSE broadcasts cancel to other stations

1. Open `/staff/bar` in one tab, `/staff/kitchen` in another
2. Cancel a FOOD item from the kitchen tab
3. **Expected:** Overview page (if open) shows updated total. The cancelled item is reflected in real-time.

### Concurrent cancellations

1. Two staff members view the same order on different devices
2. Both cancel different items simultaneously
3. **Expected:** Both cancellations succeed, totalAmount reflects both removals correctly.

## Failure Signals

- Kitchen page shows DRINK items (station filter broken)
- Overview page is blank or missing items (station="all" not working)
- Cancel button doesn't appear on PENDING/PREPARING/READY items
- totalAmount doesn't update after cancellation
- Navigation tabs don't highlight the active route
- TypeScript errors in source files (not .next/dev/types)

## Not Proven By This UAT

- Live SSE streaming latency (<3 second requirement) — requires running dev server with real WebSocket timing
- Multi-device concurrent SSE connections — requires multiple physical clients
- Tablet/desktop layout optimization — requires visual inspection at various viewport sizes
- Network disconnection handling — deferred to S03
- Notification chimes for new orders — deferred to S03
- Auto-hide completed items — deferred to S03

## Notes for Tester

- The `.next/dev/types/` directory may contain stale auto-generated files. If `npx tsc --noEmit` fails with route validator errors, delete `.next/dev/types/` and retry.
- Cancel button is intentionally NOT shown for SERVED items (already fulfilled) or CANCELLED items (already cancelled).
- The overview page at `/staff` uses exact path matching — it will NOT falsely highlight when on `/staff/bar` or `/staff/kitchen`.
