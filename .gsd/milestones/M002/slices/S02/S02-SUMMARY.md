---
id: S02
parent: M002
milestone: M002
provides:
  - ["Order + OrderItem DB records with status PENDING, server-computed totalAmount, correct FKs", "POST /api/order endpoint with full validation (400/404/409)", "CartProvider context with useReducer + sessionStorage persistence", "Complete customer ordering write-path: menu → cart → submit → confirmation → order more"]
requires:
  - slice: S01
    provides: MenuView component with tabbed DRINK/FOOD display, formatVND utility, ErrorPage component, table validation in page.tsx
affects:
  - ["M003 staff dashboard reads Order/OrderItem records created here", "M004 billing reads Order records with totalAmount computed here"]
key_files:
  - ["src/components/order/CartProvider.tsx", "src/components/order/CartBar.tsx", "src/components/order/CartSheet.tsx", "src/components/order/CartUI.tsx", "src/components/order/OrderConfirmation.tsx", "src/app/api/order/route.ts", "src/app/order/page.tsx"]
key_decisions:
  - ["useReducer with payload wrappers for predictable multi-action cart state", "sessionStorage keyed by tableId for cross-table isolation", "CartUI manages ViewState discriminated union to keep page.tsx as server component", "Server always re-computes totalAmount from DB prices — never trusts client", "Prisma $transaction for atomic Order + OrderItems creation", "409 status for unavailable items with unavailableItems array for UI highlighting"]
patterns_established:
  - ["CartProvider useReducer + sessionStorage hydration guard pattern", "Thin client wrapper (CartUI) accepting children for server/client component boundary management", "Spring-like cubic-bezier(0.32, 0.72, 0, 1) staggered entrance animations", "ViewState discriminated union for view transitions within client boundary", "Server-side price computation with full FK validation chain in API routes"]
observability_surfaces:
  - ["console.error('[POST /api/order] Transaction failed:', error) logs Prisma transaction failures"]
drill_down_paths:
  - [".gsd/milestones/M002/slices/S02/tasks/T01-SUMMARY.md", ".gsd/milestones/M002/slices/S02/tasks/T02-SUMMARY.md", ".gsd/milestones/M002/slices/S02/tasks/T03-SUMMARY.md"]
duration: ""
verification_result: passed
completed_at: 2026-05-06T04:45:05.633Z
blocker_discovered: false
---

# S02: Cart + Order Submission — Full Ordering Flow

**Full cart-to-order flow: sticky cart bar, slide-up cart sheet with qty/notes, POST /api/order with server-computed totals and full validation, confirmation screen with staggered animations, and 'order more' loop creating separate Order records**

## What Happened

Built the complete customer ordering write-path across three tasks:

**T01 — Cart State Provider:** Created `CartProvider.tsx` with useReducer managing five actions (ADD_ITEM, REMOVE_ITEM, UPDATE_QUANTITY, UPDATE_NOTES, CLEAR_CART). Cart is persisted to sessionStorage keyed by `trasua-cart-{tableId}` to prevent cross-table contamination. A hydration guard (`useIsHydrated`) prevents the initial empty state from overwriting stored cart data on mount. The `useCart()` hook exposes state, dispatch, totalItems, and totalAmount. MenuView was wired with `onClick` handlers dispatching ADD_ITEM, and the add button was made keyboard-accessible by removing the S01 placeholder's `tabIndex={-1}`.

**T02 — Sticky Cart Bar + Slide-Up Cart Sheet:** Created three client components: (1) `CartBar.tsx` — fixed bottom bar with item count badge and VND total, amber gradient matching M001 style, animated in/out via translateY, safe-area-inset-bottom for notched phones, hidden when cart empty. (2) `CartSheet.tsx` — slide-up overlay with scrollable item list, quantity +/- controls, per-item notes field, subtotals, grand total, and 'Gửi đơn' button. Uses spring-like `cubic-bezier(0.32, 0.72, 0, 1)` for natural animation, Escape key closes, body scroll locked when open. All touch targets ≥48px, all text Vietnamese. (3) `CartUI.tsx` — thin client wrapper managing isOpen state and later restructured to accept children and manage ViewState.

**T03 — Order API + Submission + Confirmation:** Built `POST /api/order` Route Handler with comprehensive validation chain: body shape (400), quantity positivity (400), table existence (404), menuItem existence (400), menuItem availability (409 with `unavailableItems` array). Server re-computes totalAmount from DB prices — never trusts client. Creates Order + OrderItems in a Prisma `$transaction`, returns 201 with full order details. CartSheet wired with async submission flow including loading state ("Đang gửi..."), 409 handling that highlights unavailable items with red outline, and generic error toast with cart preserved. OrderConfirmation shows staggered fadeSlideUp animation (5 elements, 0→350ms delays), order summary card with per-item notes, and 'Gọi thêm món' button. CartUI restructured to manage a ViewState discriminated union (menu | confirmation) enabling menu→confirmation→menu transitions while keeping page.tsx as a server component.

All tasks verified with `next build` passing TypeScript type-checking. T03 additionally verified all API validation paths (201, 400, 404, 409), full UI flow at mobile viewport, multi-order creation (two separate Order records in DB), server-computed totalAmount accuracy, cart clearing after submission, and Vietnamese notes storage.

## Verification

All three tasks passed `next build` with zero TypeScript errors. T03 additionally verified:
- POST /api/order valid payload → 201, correct FKs, server-computed totalAmount (35000×2 + 40000×1 = 110000 ✓)
- POST /api/order invalid tableId → 404
- POST /api/order unavailable menuItem → 409 with unavailableItems array
- POST /api/order quantity 0 → 400
- POST /api/order negative quantity → 400
- POST /api/order empty items → 400
- Full UI flow at 390px mobile: add items → cart bar → open sheet → add notes → submit → confirmation → 'Gọi thêm món' → submit second order → two separate Order records in DB
- Server-computed totalAmount matches expected sums
- Cart cleared after successful submission
- Vietnamese notes ("ít đường") correctly stored and displayed

## Requirements Advanced

- R001 — Full ordering write-path complete: customer can now scan QR → browse menu → add to cart → submit order → see confirmation. Order + OrderItems persisted to DB with correct FKs.
- R007 — Cart bar, cart sheet, and confirmation screen all mobile-first at 375px, all text in Vietnamese, touch targets ≥48px, safe-area-inset padding for notched phones.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

CartUI was restructured from a thin sibling wrapper (T02 plan) to a children-wrapping component that manages ViewState (T03), because the confirmation screen swap required a client boundary that could coordinate between MenuView and OrderConfirmation without converting page.tsx to a client component. CartProvider action types use payload wrapper objects instead of flat shapes — all consumers adapted accordingly.

## Known Limitations

No concurrent order testing — single-user flow only. Error handling for submission failures uses inline toast rather than a formal toast system. Cart sheet has no drag-to-dismiss gesture (close via backdrop tap or close button only). No optimistic UI — submission blocks on server response.

## Follow-ups

M003 staff dashboard needs to read Order + OrderItem records with status PENDING created here. Consider adding real-time notification (SSE/polling) when new orders arrive. M004 billing will sum totalAmount across orders per table session.

## Files Created/Modified

- `src/components/order/CartProvider.tsx` — New — useReducer cart state with sessionStorage persistence keyed by tableId
- `src/components/order/CartBar.tsx` — New — sticky bottom bar with item count, VND total, animated show/hide
- `src/components/order/CartSheet.tsx` — New — slide-up cart management sheet with qty +/-, notes, submit, error states
- `src/components/order/CartUI.tsx` — New — client wrapper managing sheet open/close and menu↔confirmation ViewState
- `src/components/order/OrderConfirmation.tsx` — New — confirmation screen with staggered entrance animations and order summary
- `src/app/api/order/route.ts` — New — POST handler with full validation chain and Prisma transaction
- `src/components/order/MenuView.tsx` — Modified — wired useCart ADD_ITEM dispatch, restored keyboard accessibility on add button
- `src/app/order/page.tsx` — Modified — wrapped MenuView in CartProvider + CartUI for cart and view state management
