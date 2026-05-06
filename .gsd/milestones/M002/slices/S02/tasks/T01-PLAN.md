---
estimated_steps: 17
estimated_files: 3
skills_used: []
---

# T01: Cart State Provider with sessionStorage Persistence

Create the CartProvider context with useReducer for cart state management and sessionStorage persistence.

**Steps:**
1. Create `src/components/order/CartProvider.tsx` as a Client Component ('use client'):
   - Define CartItem type: `{ menuItemId: number, name: string, price: number, quantity: number, notes: string }`
   - Define CartState: `{ items: CartItem[], tableId: number }`
   - useReducer with actions: ADD_ITEM, REMOVE_ITEM, UPDATE_QUANTITY, UPDATE_NOTES, CLEAR_CART
   - ADD_ITEM: if item exists, increment quantity; if new, add with quantity 1
   - REMOVE_ITEM: remove by menuItemId
   - UPDATE_QUANTITY: set exact quantity; if 0, remove item
   - UPDATE_NOTES: update notes for a specific item
   - CLEAR_CART: empty the cart
   - Persist to sessionStorage on every state change (keyed by tableId to avoid cross-table contamination)
   - Initialize from sessionStorage on mount (wrap in try/catch for privacy mode graceful degradation)
   - Export CartContext with state + dispatch, and a useCart() hook
   - Computed values via hook: totalItems (sum of quantities), totalAmount (sum of price * quantity)
2. Wrap the MenuView in CartProvider in the /order page layout
3. Wire the 'add to cart' action from menu item cards in MenuView to dispatch ADD_ITEM

## Inputs

- `src/components/order/MenuView.tsx (from S01, wire add-to-cart)`
- `src/app/order/page.tsx (from S01, wrap with CartProvider)`

## Expected Output

- `src/components/order/CartProvider.tsx`
- `src/components/order/MenuView.tsx (updated with add-to-cart)`
- `src/app/order/page.tsx (updated with CartProvider wrapper)`

## Verification

- `next build` completes without type errors
- Navigate to /order?table=5, tap an item card → item added to cart state (verify via React DevTools or by checking sessionStorage)
- Refresh page → cart state restored from sessionStorage
- Tap same item again → quantity increments
- Different table (/order?table=3) has independent cart
