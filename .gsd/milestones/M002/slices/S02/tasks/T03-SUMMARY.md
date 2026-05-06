---
id: T03
parent: S02
milestone: M002
key_files:
  - src/app/api/order/route.ts
  - src/components/order/CartSheet.tsx
  - src/components/order/OrderConfirmation.tsx
  - src/components/order/CartUI.tsx
  - src/app/order/page.tsx
key_decisions:
  - OrderResult type exported from CartSheet for cross-component reuse rather than creating a separate types file — keeps types co-located with the component that produces them
  - CartUI restructured to accept children (MenuView) and manage view state — enables menu↔confirmation swap without making page.tsx a client component
  - Error state in CartSheet clears automatically when items change — prevents stale error display after user removes unavailable items
duration: 
verification_result: passed
completed_at: 2026-05-06T04:42:05.385Z
blocker_discovered: false
---

# T03: Built POST /api/order Route Handler with full validation, wired cart submission with loading/error states, and created OrderConfirmation with staggered entrance animations

**Built POST /api/order Route Handler with full validation, wired cart submission with loading/error states, and created OrderConfirmation with staggered entrance animations**

## What Happened

Implemented all four deliverables for order creation:

1. **POST /api/order Route Handler** (`src/app/api/order/route.ts`): Full validation chain — body shape (400), quantity positivity (400), table existence (404), menu item existence (400), menu item availability (409 with `unavailableItems` array), server-computed totalAmount. Creates Order + OrderItems in a Prisma `$transaction`, then re-fetches with `include: { items: { include: { menuItem } } }` for the response payload. Returns 201 with full order details.

2. **CartSheet submission wiring**: Replaced the T02 placeholder `handleSubmit` with a real async flow — sets `isSubmitting` state (disables button, changes text to "Đang gửi..."), POSTs cart data to `/api/order`, handles success (clears cart via dispatch, closes sheet, calls `onOrderSuccess`), handles 409 unavailable items (highlights affected items with red outline + "Món này đã hết hàng" label), and generic errors (inline error toast "Không gửi được đơn. Vui lòng thử lại." with cart preserved). Errors clear when items change.

3. **OrderConfirmation component** (`src/components/order/OrderConfirmation.tsx`): Full-viewport confirmation screen with staggered fadeSlideUp entrance animation (5 elements, 0ms→350ms delays using `cubic-bezier(0.32, 0.72, 0, 1)`). Shows checkmark circle with amber gradient, "Đặt món thành công!" heading, table/order info, item summary card with per-item notes, and "Gọi thêm món" button. All numbers use `tabular-nums`, headings use `text-wrap: balance`.

4. **View state management**: Restructured `CartUI.tsx` to accept children (MenuView) and manage a `ViewState` discriminated union (`menu` | `confirmation`). When order succeeds, swaps the entire content area to the confirmation screen. "Gọi thêm món" returns to menu view. Server component page.tsx wraps MenuView as children of CartUI, passing `tableId` and `tableNumber`.

## Verification

- `next build` passes: TypeScript type-checking + compilation + all 10 routes generated including new `/api/order`
- POST /api/order with valid payload → 201, Order + OrderItems in DB with correct FKs and server-computed totalAmount (35000×2 + 40000×1 = 110000 ✓)
- POST /api/order with invalid tableId (9999) → 404
- POST /api/order with unavailable menuItemId → 409 with `{ unavailableItems: [113] }`
- POST /api/order with quantity 0 → 400
- POST /api/order with negative quantity → 400
- POST /api/order with empty items → 400
- Full UI flow at 390px mobile viewport: add items → cart bar shows → open sheet → add notes → submit → confirmation shows with staggered animation
- "Gọi thêm món" → back to menu → submit second order → two separate Order records in DB (id:3, id:4)
- Server-computed totalAmount matches expected sums
- Cart cleared after successful submission (no cart bar visible after return to menu)
- Vietnamese notes ("ít đường") correctly stored and displayed

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx next build` | 0 | ✅ pass | 8500ms |
| 2 | `curl POST /api/order (valid payload)` | 0 | ✅ pass — 201, totalAmount=110000 | 5000ms |
| 3 | `curl POST /api/order (invalid tableId)` | 0 | ✅ pass — 404 | 500ms |
| 4 | `curl POST /api/order (unavailable item)` | 0 | ✅ pass — 409 | 500ms |
| 5 | `curl POST /api/order (quantity 0)` | 0 | ✅ pass — 400 | 500ms |
| 6 | `curl POST /api/order (negative qty)` | 0 | ✅ pass — 400 | 500ms |
| 7 | `curl POST /api/order (empty items)` | 0 | ✅ pass — 400 | 500ms |
| 8 | `browser: full UI flow at 390px` | 0 | ✅ pass — add→cart→notes→submit→confirm→orderMore→submit2 | 15000ms |
| 9 | `DB query: two separate Order records` | 0 | ✅ pass — orders id:3 and id:4 both for tableId:95 | 200ms |

## Deviations

CartUI restructured from thin wrapper (no children, sibling to MenuView) to children-wrapping component that manages view state. This was necessary because the plan calls for 'menu → confirmation → menu via state' but CartUI was the only client boundary that could coordinate between MenuView visibility and OrderConfirmation display without converting page.tsx to a client component.

## Known Issues

None.

## Files Created/Modified

- `src/app/api/order/route.ts`
- `src/components/order/CartSheet.tsx`
- `src/components/order/OrderConfirmation.tsx`
- `src/components/order/CartUI.tsx`
- `src/app/order/page.tsx`
