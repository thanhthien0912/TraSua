# S01: Menu Browsing — QR to Tabbed Menu Display — UAT

**Milestone:** M002
**Written:** 2026-05-06T04:19:21.931Z

# S01: Menu Browsing — QR to Tabbed Menu Display — UAT

**Milestone:** M002
**Written:** 2025-07-11

## UAT Type

- UAT mode: mixed (artifact-driven build verification + live-runtime browser checks during task execution)
- Why this mode is sufficient: Read-only page rendering from seeded DB — no mutations, no async flows. Browser screenshots + build pass confirm functional correctness.

## Preconditions

- `npm run dev` running at localhost:3000
- Database seeded with 18 menu items (12 DRINK, 6 FOOD) and 15 tables (via `npx prisma db seed`)
- Browser viewport set to mobile width (375-390px)

## Smoke Test

Navigate to `/order?table=5` on a phone-sized viewport → should see 'Bàn 5' header, 'Đồ uống' tab active, drink items with VND prices.

## Test Cases

### 1. Valid table shows tabbed menu

1. Navigate to `/order?table=5`
2. Observe the header shows 'Bàn 5' with tea emoji
3. 'Đồ uống' tab is active (amber-900 background)
4. Drink items are displayed as cards below
5. **Expected:** 12 drink items visible with Vietnamese names and VND-formatted prices (e.g. '35.000đ', '45.000đ')

### 2. Tab switching between DRINK and FOOD

1. On `/order?table=5`, observe 'Đồ uống' tab active with drink items
2. Tap 'Đồ ăn' tab
3. **Expected:** Tab switches to active state, 6 food items display with VND prices. Drink items no longer visible.

### 3. Items sorted by sortOrder

1. On `/order?table=5` with 'Đồ uống' tab active
2. Note the order of drink items top to bottom
3. Switch to 'Đồ ăn' tab
4. **Expected:** Items within each tab are displayed in their configured sortOrder, matching the seed data sequence

### 4. VND price formatting with tabular-nums

1. On `/order?table=5`, observe prices on item cards
2. **Expected:** Prices formatted as Vietnamese locale (e.g. '45.000đ'), digits aligned using tabular-nums font feature

### 5. Invalid table shows Vietnamese error page

1. Navigate to `/order?table=99`
2. **Expected:** Full-screen error page with 'Không tìm thấy bàn' heading, amber branding, message 'Bàn không hợp lệ. Vui lòng scan lại mã QR tại bàn của bạn.', no navigation links

### 6. Missing table param shows same error page

1. Navigate to `/order` (no query params)
2. **Expected:** Same Vietnamese error page as test 5 — identical dead-end behavior

### 7. All text in Vietnamese

1. Navigate to `/order?table=5`
2. Scan all visible text: header, tab labels, item names, descriptions
3. **Expected:** No English text anywhere in the customer UI. Tab labels are 'Đồ uống' and 'Đồ ăn'

## Edge Cases

### Unavailable item shows 'Hết hàng' badge

1. Mark one menu item as `available: false` in the database
2. Navigate to `/order?table=5` and find that item's category tab
3. **Expected:** Item appears grayed out (opacity-55), shows 'Hết hàng' badge, no plus button, does not look tappable

### Non-numeric table param

1. Navigate to `/order?table=abc`
2. **Expected:** Vietnamese error page (parseInt returns NaN → validation fails)

### Table param as array

1. Navigate to `/order?table=5&table=6`
2. **Expected:** Vietnamese error page (searchParams.table is string[] not string → validation fails)

## Failure Signals

- English text appearing in any customer-facing UI element
- Crash/blank page on `/order?table=5` instead of tabbed menu
- Prices showing raw numbers without VND formatting
- No error page on invalid/missing table params
- Tab switching not filtering items by category
- Console errors or failed network requests on page load

## Not Proven By This UAT

- Cart functionality (plus button is non-functional placeholder — wired in S02)
- Order submission flow (S02 scope)
- Unavailable item badge only structurally verified — no unavailable items in seed data for visual confirmation
- Performance under concurrent users
- Responsive behavior on tablets or larger screens (tested at mobile width only)
- Sticky header scroll behavior under long lists

## Notes for Tester

- The plus button on item cards is intentionally non-functional (`tabIndex=-1`) — it's a visual placeholder for S02.
- Seed data has no unavailable items, so the 'Hết hàng' badge edge case requires manual DB update to test.
- VND formatting uses the locale separator which may show as '.' or ',' depending on the browser's Intl implementation — both are correct.
