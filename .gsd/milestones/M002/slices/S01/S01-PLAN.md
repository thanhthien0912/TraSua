# S01: Menu Browsing — QR to Tabbed Menu Display

**Goal:** Customer scans QR code at their table and sees the full menu organized by Đồ uống / Đồ ăn tabs on their phone, with VND-formatted prices, unavailable item badges, and Vietnamese error pages for invalid tables.
**Demo:** Customer visits /order?table=5 on a phone → sees tabbed menu with 'Đồ uống' active showing seeded drink items with VND prices → switches to 'Đồ ăn' → sees food items → unavailable items show 'Hết hàng' badge and are not tappable. Visiting /order?table=99 or /order shows Vietnamese error page.

## Must-Haves

- /order?table=5 renders tabbed menu with real seeded items at 375px viewport width
- Tabs switch between Đồ uống (12 drinks) and Đồ ăn (6 food items)
- Items sorted by sortOrder within each category
- Prices display as VND format (e.g. '45,000đ') with tabular-nums
- Unavailable items show 'Hết hàng' badge and are visually disabled
- /order?table=99 shows 'Bàn không hợp lệ' error page
- /order (no param) shows same error page
- next build completes without type errors
- All text in Vietnamese, no English in customer UI

## Proof Level

- This slice proves: integration — real seeded data from SQLite rendered in mobile viewport

## Integration Closure

S01 establishes the /order page shell, menu item card component, VND formatter, and table validation pattern. S02 adds cart interactivity on top of this foundation.

## Verification

- None — read-only page with no logging requirements for M002.

## Tasks

- [x] **T01: VND Formatter Utility + Order Page with Table Validation** `est:25 min`
  Create the VND price formatting utility and the /order Server Component page with table validation.
  - Files: `src/lib/format.ts`, `src/app/order/page.tsx`, `src/components/order/ErrorPage.tsx`
  - Verify: - `next build` completes without type errors
- Navigate to /order?table=99 — see Vietnamese error page
- Navigate to /order — see Vietnamese error page
- Navigate to /order?table=5 — page does not crash (MenuView not yet built, but server component renders)

- [x] **T02: Tabbed Menu View with Item Cards** `est:35 min`
  Build the MenuView client component with category tabs and item cards.
  - Files: `src/components/order/MenuView.tsx`, `src/app/order/page.tsx`
  - Verify: - `next build` completes without type errors
- Navigate to /order?table=5 at 375px viewport → see tabbed menu with 'Đồ uống' active
- Drink items display with VND-formatted prices
- Switch to 'Đồ ăn' tab → food items display
- Items sorted by sortOrder within each tab
- Unavailable items show 'Hết hàng' badge and appear grayed out
- All text in Vietnamese

## Files Likely Touched

- src/lib/format.ts
- src/app/order/page.tsx
- src/components/order/ErrorPage.tsx
- src/components/order/MenuView.tsx
