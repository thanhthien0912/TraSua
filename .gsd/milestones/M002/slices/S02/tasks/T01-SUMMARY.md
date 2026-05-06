---
id: T01
parent: S02
milestone: M002
key_files:
  - src/components/order/CartProvider.tsx
  - src/components/order/MenuView.tsx
  - src/app/order/page.tsx
key_decisions:
  - Used useReducer over useState for predictable multi-action cart state
  - sessionStorage keyed by tableId (trasua-cart-{tableId}) to prevent cross-table contamination
  - Hydration guard pattern to prevent empty-state overwrite of stored cart on mount
  - useCart hook imports directly in MenuView (both are client components) rather than prop-drilling callbacks
duration: 
verification_result: passed
completed_at: 2026-05-06T04:26:27.505Z
blocker_discovered: false
---

# T01: Created CartProvider with useReducer state management, sessionStorage persistence keyed by tableId, and wired add-to-cart from MenuView

**Created CartProvider with useReducer state management, sessionStorage persistence keyed by tableId, and wired add-to-cart from MenuView**

## What Happened

Created `CartProvider.tsx` as a client component with full useReducer implementation covering five actions: ADD_ITEM (increment existing or append new), REMOVE_ITEM, UPDATE_QUANTITY (remove on zero), UPDATE_NOTES, and CLEAR_CART. Cart state is persisted to sessionStorage keyed by `trasua-cart-{tableId}` to avoid cross-table contamination. Initialization from sessionStorage is wrapped in try/catch for privacy mode graceful degradation. A hydration guard (`useIsHydrated`) prevents the initial empty state from overwriting stored cart data on mount.

The `useCart()` hook exposes state, dispatch, totalItems, and totalAmount as computed values. MenuView was updated to import `useCart` directly (it's already a client component) and wire the existing placeholder + button's onClick to dispatch ADD_ITEM with `e.stopPropagation()` to prevent card-level click interference. The `tabIndex={-1}` was removed from the button to make it keyboard-accessible.

The server component `page.tsx` wraps the client tree with `<CartProvider tableId={tableInfo.id}>` — this works because server components can render client components and pass serializable props. The existing `CartSheet.tsx` (from a parallel or prior task) was already importing from CartProvider with the correct dispatch format, and the build confirmed type compatibility across all consumers.

## Verification

Ran `npx next build` after clearing `.next` cache. Build completed successfully: TypeScript type-checking passed, all 9 routes generated without errors including the dynamic `/order` route that uses CartProvider.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx next build` | 0 | ✅ pass | 9500ms |

## Deviations

Removed tabIndex={-1} from the add button to restore keyboard accessibility — the placeholder convention from S01 was intentionally non-interactive, but now that the handler is wired it should be focusable.

## Known Issues

None.

## Files Created/Modified

- `src/components/order/CartProvider.tsx`
- `src/components/order/MenuView.tsx`
- `src/app/order/page.tsx`
