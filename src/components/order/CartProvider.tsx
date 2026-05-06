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
  notes: string
}

type CartState = {
  items: CartItem[]
  tableId: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { menuItemId: number; name: string; price: number } }
  | { type: 'REMOVE_ITEM'; payload: { menuItemId: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { menuItemId: number; quantity: number } }
  | { type: 'UPDATE_NOTES'; payload: { menuItemId: number; notes: string } }
  | { type: 'CLEAR_CART' }

type CartContextValue = {
  state: CartState
  dispatch: Dispatch<CartAction>
  totalItems: number
  totalAmount: number
}

// ─── Context ────────────────────────────────────────────────────────
const CartContext = createContext<CartContextValue | null>(null)

// ─── Reducer ────────────────────────────────────────────────────────
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
        items: [
          ...state.items,
          { menuItemId, name, price, quantity: 1, notes: '' },
        ],
      }
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(
          (i) => i.menuItemId !== action.payload.menuItemId,
        ),
      }
    }

    case 'UPDATE_QUANTITY': {
      const { menuItemId, quantity } = action.payload
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.menuItemId !== menuItemId),
        }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity } : i,
        ),
      }
    }

    case 'UPDATE_NOTES': {
      const { menuItemId, notes } = action.payload
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuItemId === menuItemId ? { ...i, notes } : i,
        ),
      }
    }

    case 'CLEAR_CART': {
      return { ...state, items: [] }
    }
  }
}

// ─── Storage helpers ────────────────────────────────────────────────
function storageKey(tableId: number) {
  return `trasua-cart-${tableId}`
}

function loadCart(tableId: number): CartItem[] {
  try {
    const raw = sessionStorage.getItem(storageKey(tableId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    // Privacy mode or corrupt data — start fresh
    return []
  }
}

function saveCart(tableId: number, items: CartItem[]) {
  try {
    sessionStorage.setItem(storageKey(tableId), JSON.stringify(items))
  } catch {
    // sessionStorage unavailable — degrade silently
  }
}

// ─── Provider ───────────────────────────────────────────────────────
export function CartProvider({
  tableId,
  children,
}: {
  tableId: number
  children: ReactNode
}) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    tableId,
  })

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const saved = loadCart(tableId)
    if (saved.length > 0) {
      // Replay saved items — reducer starts empty, so we add each
      for (const item of saved) {
        // Dispatch individual adds to go through reducer properly,
        // then set final quantities via UPDATE_QUANTITY
        dispatch({
          type: 'ADD_ITEM',
          payload: {
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
          },
        })
        if (item.quantity > 1) {
          dispatch({
            type: 'UPDATE_QUANTITY',
            payload: { menuItemId: item.menuItemId, quantity: item.quantity },
          })
        }
        if (item.notes) {
          dispatch({
            type: 'UPDATE_NOTES',
            payload: { menuItemId: item.menuItemId, notes: item.notes },
          })
        }
      }
    }
  }, [tableId])

  // Persist to sessionStorage on every change (skip initial empty state)
  const isHydrated = useIsHydrated()
  useEffect(() => {
    if (isHydrated) {
      saveCart(tableId, state.items)
    }
  }, [state.items, tableId, isHydrated])

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount = state.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  )

  return (
    <CartContext value={{ state, dispatch, totalItems, totalAmount }}>
      {children}
    </CartContext>
  )
}

// ─── Hook ───────────────────────────────────────────────────────────
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return ctx
}

// ─── Hydration guard ────────────────────────────────────────────────
function useIsHydrated() {
  const [hydrated, setHydrated] = useReducer(() => true, false)
  useEffect(() => {
    setHydrated()
  }, [])
  return hydrated
}
