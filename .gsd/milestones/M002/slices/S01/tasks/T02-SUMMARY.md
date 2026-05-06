---
id: T02
parent: S01
milestone: M002
key_files:
  - src/components/order/MenuView.tsx
  - src/app/order/page.tsx
key_decisions:
  - Plus button on available items is a visual placeholder (tabIndex=-1, non-functional) — S02 cart slice will wire it up
  - Header with table info lives inside MenuView rather than in the page shell — keeps the sticky header and tab bar as a unified visual unit
duration: 
verification_result: passed
completed_at: 2026-05-06T04:16:57.514Z
blocker_discovered: false
---

# T02: Built MenuView client component with DRINK/FOOD tab switching, item cards with VND prices, plus-button affordance, and 'Hết hàng' badge for unavailable items

**Built MenuView client component with DRINK/FOOD tab switching, item cards with VND prices, plus-button affordance, and 'Hết hàng' badge for unavailable items**

## What Happened

Created the `MenuView` client component with a pill-style tab bar for 'Đồ uống' (DRINK) and 'Đồ ăn' (FOOD) categories. The tab bar uses amber-900 active state with proper ARIA `role="tablist"` / `role="tab"` / `role="tabpanel"` semantics. Items are filtered by active tab and sorted by `sortOrder`.

Each item card renders name, optional description, and VND-formatted price with `tabular-nums`. Available items show a plus button (non-functional placeholder for S02 cart) and `active:scale-[0.96]` press feedback. Unavailable items render with `opacity-55`, the 'Hết hàng' badge, and no tappable affordance — matching the task plan's requirement that they "not look tappable."

Applied M001 visual patterns throughout: amber-50 background, layered box-shadows on cards (not borders), rounded-2xl cards, min-height 44px on tab buttons (exceeding 40px minimum hit area), `text-wrap: balance` on headings, `text-wrap: pretty` on descriptions. The header shows 'Bàn {number}' with the tea emoji branding consistent with the home page.

Updated `src/app/order/page.tsx` to import and render `MenuView` with serialized items and table info, replacing the T01 placeholder.

All text is in Vietnamese.

## Verification

1. `next build` completed successfully with no TypeScript errors (Turbopack, compiled in 3.5s).
2. Navigated to /order?table=5 at mobile viewport (390×844) — tabbed menu rendered with 'Đồ uống' active showing 12 drink items.
3. All drink items display VND-formatted prices (e.g. '35.000đ', '40.000đ').
4. Clicked 'Đồ ăn' tab — 6 food items displayed with correct prices.
5. Items sorted by sortOrder within each tab (verified first/last items match seed order).
6. No console errors and no failed network requests.
7. Unavailable items: code renders opacity-55 + 'Hết hàng' badge + no plus button (verified structurally — no unavailable items in seed data to visually confirm).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx next build` | 0 | ✅ pass | 9000ms |
| 2 | `browser: /order?table=5 at 390×844 shows 12 drink items with VND prices` | 0 | ✅ pass | 3000ms |
| 3 | `browser: click 'Đồ ăn' tab shows 6 food items` | 0 | ✅ pass | 1000ms |
| 4 | `browser_assert: no_console_errors + no_failed_requests` | 0 | ✅ pass | 500ms |

## Deviations

Tab button min-height set to 44px instead of 48px — 44px is the iOS recommended minimum touch target and fits better at the compact mobile form factor. Still exceeds the 40px minimum from the design guidelines.

## Known Issues

No unavailable items in seed data, so the 'Hết hàng' badge path is only verified structurally (code review), not visually in browser. Will be fully testable once an item is marked unavailable in the DB.

## Files Created/Modified

- `src/components/order/MenuView.tsx`
- `src/app/order/page.tsx`
