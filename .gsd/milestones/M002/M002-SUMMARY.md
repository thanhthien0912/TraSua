---
id: M002
title: "Customer Order Flow"
status: complete
completed_at: 2026-05-06T04:54:58.585Z
key_decisions:
  - D006: Two-slice decomposition (read/write paths) validated — clean boundary, each independently demoable
  - D007: Route Handler for order creation validated — JSON payload + custom status codes (400/404/409) worked well for validation chain
  - CartUI children-wrapping pattern with ViewState discriminated union — keeps page.tsx as server component while enabling full client-side view transitions
  - Server-side totalAmount computation with full FK validation chain — never trusts client
  - sessionStorage keyed by tableId for cart persistence — prevents cross-table contamination
  - useReducer with payload wrapper objects for predictable multi-action cart state
key_files:
  - src/lib/format.ts
  - src/app/order/page.tsx
  - src/components/order/ErrorPage.tsx
  - src/components/order/MenuView.tsx
  - src/components/order/CartProvider.tsx
  - src/components/order/CartBar.tsx
  - src/components/order/CartSheet.tsx
  - src/components/order/CartUI.tsx
  - src/components/order/OrderConfirmation.tsx
  - src/app/api/order/route.ts
lessons_learned:
  - Children-wrapping pattern for client boundaries: when a server component page needs client-side view transitions, wrap children (server components) in a client wrapper managing ViewState — avoids converting the page itself to a client component
  - sessionStorage keyed by domain entity (tableId) prevents cross-entity state contamination while keeping persistence simple
  - Spring-like cubic-bezier(0.32, 0.72, 0, 1) produces natural animation feel for slide-up sheets and staggered entrances
  - Server-side price computation is non-negotiable for order APIs — validates every FK in the chain and recomputes totals from DB prices
  - Dead-end error page pattern (no navigation links) effectively blocks invalid state entry points
---

# M002: Customer Order Flow

**Built the complete customer-facing mobile ordering flow — QR scan to tabbed menu browsing, client-side cart with sessionStorage persistence, server-validated order submission via Route Handler, and animated confirmation with multi-order support.**

## What Happened

M002 delivered the customer-facing ordering flow in two vertical slices that map to the read path (S01: menu browsing) and write path (S02: cart + order submission).

**S01 — Menu Browsing (read path):** Created the `/order?table=N` page as an async Server Component with three-gate table validation (string param → numeric parse → DB lookup). Invalid or missing table params render a Vietnamese dead-end ErrorPage with no navigation escape routes. Valid tables fetch all menu items sorted by `sortOrder`, serialize them as plain objects (stripping Prisma metadata), and pass to the `MenuView` client component. MenuView implements a pill-style tab bar with ARIA tablist/tab/tabpanel semantics for 'Đồ uống' (DRINK, default) and 'Đồ ăn' (FOOD). Item cards show name, optional description, and VND-formatted prices using tabular-nums. Unavailable items render at reduced opacity with a 'Hết hàng' badge and no add affordance. A shared `formatVND()` utility was created in `src/lib/format.ts` using a module-level `Intl.NumberFormat` instance.

**S02 — Cart + Order Submission (write path):** Built five new components and one API route. `CartProvider` manages cart state via useReducer with five action types and sessionStorage persistence keyed by tableId. A hydration guard prevents the initial empty state from overwriting stored cart on mount. `CartBar` is a fixed bottom bar with animated show/hide, item count badge, and VND total. `CartSheet` is a slide-up overlay with per-item quantity +/−, notes field, subtotals, grand total, and 'Gửi đơn' submit button — using spring-like cubic-bezier animation and Escape key dismissal. `CartUI` wraps MenuView as children and manages a ViewState discriminated union (menu | confirmation) enabling full view transitions while keeping page.tsx as a server component. `POST /api/order` validates body shape (400), quantity positivity (400), table existence (404), menuItem existence (400), and availability (409 with unavailableItems array). Server always re-computes totalAmount from DB prices, creates Order + OrderItems atomically via Prisma $transaction, and returns 201 with full order details. `OrderConfirmation` shows a staggered fadeSlideUp animation with order summary and 'Gọi thêm món' button that resets to menu view for another order.

The two slices integrate cleanly — S01's MenuView placeholder add button was wired to S02's CartProvider dispatch, and the server/client component boundary was preserved by CartUI's children-wrapping pattern. All 10 implementation files pass TypeScript strict mode and Next.js build verification.

## Success Criteria Results

### Success Criteria Results

- **✅ Customer visits /order?table=5 → sees tabbed menu with 'Đồ uống' active, seeded drink items with VND-formatted prices**
  Evidence: `MenuView.tsx` defaults `activeTab` to `'DRINK'`, tab labels 'Đồ uống'/'Đồ ăn', items fetched from seeded DB sorted by `sortOrder`, prices rendered via `formatVND()`. Verified at 390px mobile viewport in S01/T02 and S02/T03.

- **✅ Customer switches to 'Đồ ăn' tab → sees food items sorted by sortOrder**
  Evidence: Tab switching filters by `item.category === activeTab`, items sorted by `sortOrder`. Verified in S01/T02 browser testing — 6 food items displayed correctly.

- **✅ Unavailable items show 'Hết hàng' badge and cannot be added to cart**
  Evidence: `ItemCard` checks `!item.available` → renders 'Hết hàng' badge, opacity-55, no add button. Code-verified structurally (no unavailable items in seed data for visual confirmation).

- **✅ Customer adds items → sticky bottom bar shows count + total → taps to open slide-up cart sheet**
  Evidence: `CartBar.tsx` fixed at bottom with animated translateY, shows `totalItems` + `formatVND(totalAmount)`. Opens `CartSheet` on tap. Verified in S02/T02 and T03.

- **✅ Cart sheet shows qty +/-, notes field per item, subtotals, grand total, 'Gửi đơn' button**
  Evidence: `CartSheet.tsx` contains `CartItemRow` with MinusIcon/PlusIcon quantity controls, notes input field, per-item subtotal, footer grand total, and 'Gửi đơn' button. Verified in S02/T03 browser testing.

- **✅ Customer taps 'Gửi đơn' → Order + OrderItems created in DB with correct tableId, menuItemId, quantity, notes, and server-computed totalAmount**
  Evidence: `POST /api/order` validates all FKs, re-computes totalAmount server-side, uses `prisma.$transaction`. Verified: 35000×2 + 40000×1 = 110000 correct. Vietnamese notes ("ít đường") stored correctly.

- **✅ Confirmation screen shows order summary → 'Gọi thêm món' returns to menu → second order creates separate DB record**
  Evidence: `OrderConfirmation.tsx` displays order details, 'Gọi thêm món' triggers `onOrderMore` resetting ViewState to menu. CLEAR_CART dispatched. Verified: two separate Order records created in DB after two submissions.

- **✅ /order?table=99 and /order (no param) both show Vietnamese error page — no ordering possible**
  Evidence: `page.tsx` validates table param through three gates, renders `ErrorPage` with 'Bàn không hợp lệ' message for any failure. Verified in S01/T01 browser testing.

## Definition of Done Results

### Definition of Done Results

- **✅ All slices complete:** S01 (complete, 2/2 tasks done) and S02 (complete, 3/3 tasks done) — verified via `gsd_milestone_status`.
- **✅ All slice summaries exist:** S01-SUMMARY.md and S02-SUMMARY.md both present with full verification results.
- **✅ Cross-slice integration verified:** S01's MenuView plus button placeholder wired to S02's CartProvider dispatch. S01's formatVND() utility reused by S02's CartBar, CartSheet, and OrderConfirmation. S01's table validation in page.tsx extended with CartProvider + CartUI wrapping in S02.
- **✅ Build passes:** `next build` succeeds with zero TypeScript errors, all routes generated correctly (/ ○, /order ƒ, /api/order ƒ).
- **✅ Code changes verified:** 10 non-.gsd implementation files across 4 M002 commits (79d914a, 97593e2, 8dc86f9, 1f3cb5a).

## Requirement Outcomes

### Requirement Status Transitions

- **R001 (core-capability) — active → active (advanced):** M002 delivers the customer-facing half: QR scan → menu → cart → order submission → confirmation. Orders persist to DB with correct FKs and server-computed totals. Staff receiving orders (second half) is M003 scope.

- **R005 (primary-user-loop) — active → active (advanced):** QR codes generated in M001 now have a working destination. `/order?table=N` renders the full menu for valid tables.

- **R006 (constraint) — active → active (maintained):** All assets and data are local. No CDN, no external API calls. formatVND uses Intl.NumberFormat (built-in), no remote dependencies.

- **R007 (quality-attribute) — active → active (advanced):** Full customer-facing UI verified at mobile viewport (390px), all text Vietnamese, tabular-nums prices, 44px+ touch targets, safe-area-inset-bottom, amber/warm branding. Cart bar, sheet, and confirmation all mobile-first.

No requirements changed status (Active → Validated requires full validation criteria met, which depends on M003 for R001).

## Deviations

1. Tab button min-height 44px instead of 48px (iOS recommended minimum, better fit at compact mobile form factor)
2. CartUI restructured from thin sibling wrapper to children-wrapping ViewState manager (necessary for menu↔confirmation transitions without converting page.tsx to client component)
3. CartProvider action types use payload wrapper objects instead of flat shapes (more type-safe, all consumers adapted)

## Follow-ups

1. M003 staff dashboard needs to read Order + OrderItem records with status PENDING created here
2. Consider adding at least one unavailable menu item to seed data for visual QA of the 'Hết hàng' badge
3. Consider real-time notification (SSE/polling) when new orders arrive (M003)
4. M004 billing will sum totalAmount across orders per table session
5. Cart sheet drag-to-dismiss gesture not implemented (close via backdrop tap or close button only)
6. No concurrent order testing — single-user flow only verified
