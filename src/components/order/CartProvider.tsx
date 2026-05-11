'use client'

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from 'react'

// ─── Types ──────────────────────────────────────────────────────────
export type CartItem = {
  menuItemId: number
  name: string
  price: number
  quantity: number
}

type CartState = {
  items: CartItem[]
  tableId: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { menuItemId: number; name: string; price: number } }
  | { type: 'REMOVE_ITEM'; payload: { menuItemId: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { menuItemId: number; quantity: number } }
  | { type: 'CLEAR_CART' }

type CartContextValue = {
  state: CartState
  dispatch: Dispatch<CartAction>
  totalItems: number
  totalAmount: number
}

const CartContext = createContext<CartContextValue | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { menuItemId, name, price } = action.payload
      const existing = state.items.find((i) => i.menuItemId === menuItemId)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.menuItemId === menuItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { menuItemId, name, price, quantity: 1 }],
      }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.menuItemId !== action.payload.menuItemId) }
    case 'UPDATE_QUANTITY': {
      const { menuItemId, quantity } = action.payload
      if (quantity <= 0) return { ...state, items: state.items.filter((i) => i.menuItemId !== menuItemId) }
      return { ...state, items: state.items.map((i) => i.menuItemId === menuItemId ? { ...i, quantity } : i) }
    }
    case 'CLEAR_CART':
      return { ...state, items: [] }
  }
}

function storageKey(tableId: number) { return `trasua-cart-${tableId}` }
function loadCart(tableId: number): CartItem[] {
  try {
    const raw = sessionStorage.getItem(storageKey(tableId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}
function saveCart(tableId: number, items: CartItem[]) {
  try { sessionStorage.setItem(storageKey(tableId), JSON.stringify(items)) } catch {}
}

export function CartProvider({ tableId, children }: { tableId: number; children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], tableId })

  useEffect(() => {
    const saved = loadCart(tableId)
    if (saved.length > 0) {
      for (const item of saved) {
        dispatch({ type: 'ADD_ITEM', payload: { menuItemId: item.menuItemId, name: item.name, price: item.price } })
        if (item.quantity > 1) dispatch({ type: 'UPDATE_QUANTITY', payload: { menuItemId: item.menuItemId, quantity: item.quantity } })
      }
    }
  }, [tableId])

  const [hydrated, setHydrated] = useReducer(() => true, false)
  useEffect(() => { setHydrated() }, [])
  useEffect(() => { if (hydrated) saveCart(tableId, state.items) }, [state.items, tableId, hydrated])

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext value={{ state, dispatch, totalItems, totalAmount }}>
      {children}
    </CartContext>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
