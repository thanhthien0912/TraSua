---
id: S01
parent: M002
milestone: M002
provides:
  - ["Customer-facing /order page shell with table validation", "MenuView component with SerializedMenuItem type export", "formatVND() utility at src/lib/format.ts", "ErrorPage component for Vietnamese error states", "Tab-based menu category filtering pattern"]
requires:
  []
affects:
  - ["S02"]
key_files:
  - ["src/lib/format.ts", "src/app/order/page.tsx", "src/components/order/ErrorPage.tsx", "src/components/order/MenuView.tsx"]
key_decisions:
  - ["Inline ErrorPage dead-end for invalid tables — prevents ordering without valid QR", "Menu items serialized to plain objects at server/client boundary — strips Prisma metadata", "Plus button placeholder (tabIndex=-1) for S02 cart integration", "Header lives inside MenuView for unified sticky header + tab bar"]
patterns_established:
  - ["Server→Client serialization: strip Prisma metadata to plain objects before passing to client components", "Module-level Intl.NumberFormat instance for VND formatting efficiency", "Dead-end error page pattern for invalid URL params — no escape routes", "ARIA tablist/tab/tabpanel semantics for category navigation", "Next.js 16 Promise-based searchParams: await before destructuring"]
observability_surfaces:
  - none
drill_down_paths:
  - [".gsd/milestones/M002/slices/S01/tasks/T01-SUMMARY.md", ".gsd/milestones/M002/slices/S01/tasks/T02-SUMMARY.md"]
duration: ""
verification_result: passed
completed_at: 2026-05-06T04:19:21.931Z
blocker_discovered: false
---

# S01: Menu Browsing — QR to Tabbed Menu Display

**Customer-facing /order page with table validation, Vietnamese error pages, tabbed DRINK/FOOD menu with VND-formatted prices, sorted items, and 'Hết hàng' badge for unavailable items — all rendered from seeded SQLite data at mobile viewport**

## What Happened

Built the customer-facing menu browsing experience across two tasks:

**T01 — Foundation (VND formatter, order page, error page):** Created `src/lib/format.ts` with `formatVND()` using a module-level `Intl.NumberFormat('vi-VN')` instance for efficient VND formatting (e.g. 45000 → '45,000đ'). Built the `/order` page as an async Server Component using Next.js 16's Promise-based `searchParams` API. Table validation checks three gates: param must be a string, must parse to a number, and that number must exist in the DB via `prisma.table.findFirst()`. Invalid or missing tables render `ErrorPage` — a full-screen Vietnamese dead-end with amber branding, no navigation links to prevent ordering without a valid QR. Valid tables fetch all menu items sorted by `sortOrder` and serialize them as plain objects (stripping Prisma class metadata) for the client component boundary.

**T02 — Menu UI (tabbed view, item cards):** Created `MenuView` client component with pill-style tab bar for 'Đồ uống' (DRINK) and 'Đồ ăn' (FOOD). Proper ARIA semantics (`role="tablist"`, `role="tab"`, `role="tabpanel"`). Items filter by active tab, sort by `sortOrder`, and render as cards with name, optional description, and VND price using `tabular-nums`. Available items show a plus button (non-functional placeholder at `tabIndex=-1` for S02 cart) with `active:scale-[0.96]` press feedback. Unavailable items render with `opacity-55`, 'Hết hàng' badge, and no tappable affordance. Sticky header with table name and tab bar stays visible during scroll. All visual patterns follow M001's amber/warm color scheme with layered shadows, rounded-2xl cards, and Vietnamese text throughout.

## Verification

**Build verification:** `next build` completed successfully in both T01 and T02 — TypeScript passed, `/order` route generated as dynamic (ƒ), no type errors.

**Browser verification (T01 — 3 error/success scenarios):**
- `/order?table=99` → Vietnamese error page with 'Không tìm thấy bàn' heading ✅
- `/order` (no param) → Same Vietnamese error page ✅
- `/order?table=5` → 'Bàn 5' header with 18 menu items loaded ✅

**Browser verification (T02 — full menu interaction):**
- `/order?table=5` at 390×844 viewport → tabbed menu with 'Đồ uống' active, 12 drink items with VND prices ✅
- Clicked 'Đồ ăn' tab → 6 food items displayed ✅
- Items sorted by sortOrder within each tab ✅
- No console errors, no failed network requests ✅

**Structural verification (code review):**
- Unavailable items: opacity-55 + 'Hết hàng' badge + no plus button (no unavailable items in seed data for visual confirmation)
- All customer-facing text in Vietnamese — no English strings
- Prices use tabular-nums via fontVariantNumeric
- Tab buttons have minHeight 44px (iOS recommended touch target)

## Requirements Advanced

- R001 — Menu browsing step of the ordering flow now works — customer scans QR → sees tabbed menu with real items. Cart + submission remains for S02.
- R005 — QR codes generated in M001 now have a working destination — /order?table=N renders the menu for valid tables.
- R007 — Customer UI is fully Vietnamese, mobile-first at 375-390px, with tabular-nums prices, proper touch targets (44px), and amber branding.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

Tab button min-height set to 44px instead of 48px — 44px is the iOS recommended minimum touch target and fits better at the compact mobile form factor. Still exceeds the 40px minimum from design guidelines.

## Known Limitations

No unavailable items in seed data — 'Hết hàng' badge path verified structurally (code review) but not visually in browser. Plus button on item cards is non-functional placeholder (tabIndex=-1) — S02 wires it to cart.

## Follow-ups

S02 must wire the plus button on MenuView item cards to add-to-cart functionality. Consider adding at least one unavailable menu item to seed data for visual QA of the 'Hết hàng' badge.

## Files Created/Modified

- `src/lib/format.ts` — VND price formatter using Intl.NumberFormat vi-VN locale
- `src/app/order/page.tsx` — Async Server Component with table validation, menu item fetching, and serialization
- `src/components/order/ErrorPage.tsx` — Full-screen Vietnamese error page for invalid/missing table params
- `src/components/order/MenuView.tsx` — Client component with DRINK/FOOD tabs, item cards, VND prices, and Hết hàng badge
