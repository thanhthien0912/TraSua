'use client'

import { useEffect, useReducer, useCallback, useRef } from 'react'
import type { ItemStatus } from '@/lib/order-status'
import { deriveOrderStatus } from '@/lib/order-status'

// ─── Types ──────────────────────────────────────────────────────────

export type Station = 'bar' | 'kitchen' | 'all'
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export type OrderMenuItem = {
  id: number
  name: string
  category: 'DRINK' | 'FOOD'
  price: number
}

export type OrderItem = {
  id: number
  orderId: number
  menuItemId: number
  menuItem: OrderMenuItem
  quantity: number
  status: ItemStatus
  notes: string | null
  createdAt: string
}

export type Order = {
  id: number
  tableId: number
  table: { id: number; number: number; name: string }
  status: string
  derivedStatus: string
  totalAmount: number
  createdAt: string
  items: OrderItem[]
}

// ─── Station-level filtering ────────────────────────────────────────

const STATION_CATEGORY: Record<string, 'DRINK' | 'FOOD' | null> = {
  bar: 'DRINK',
  kitchen: 'FOOD',
  all: null,
}

/**
 * Filter order items by station category and re-derive order status.
 * SSE events broadcast full orders; station views need only their category.
 * Returns null if no items remain after filtering (order irrelevant to station).
 */
function filterOrderForStation(order: Order, station: Station): Order | null {
  const category = STATION_CATEGORY[station]
  if (!category) return order // 'all' station sees everything

  const filteredItems = order.items.filter(
    (item) => item.menuItem.category === category
  )
  if (filteredItems.length === 0) return null

  return {
    ...order,
    items: filteredItems,
    derivedStatus: deriveOrderStatus(
      filteredItems.map((i) => i.status as ItemStatus)
    ),
  }
}

// ─── Reducer ────────────────────────────────────────────────────────

type OrderState = {
  orders: Order[]
  connectionStatus: ConnectionStatus
}

type OrderAction =
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'SET_CONNECTION'; payload: ConnectionStatus }

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_ORDERS':
      return { ...state, orders: action.payload }

    case 'ADD_ORDER': {
      // Avoid duplicates — if order ID already exists, update it instead
      const exists = state.orders.some((o) => o.id === action.payload.id)
      if (exists) {
        return {
          ...state,
          orders: state.orders.map((o) =>
            o.id === action.payload.id ? action.payload : o
          ),
        }
      }
      // Add new order at the top
      return { ...state, orders: [action.payload, ...state.orders] }
    }

    case 'UPDATE_ORDER': {
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o
        ),
      }
    }

    case 'SET_CONNECTION':
      return { ...state, connectionStatus: action.payload }

    default:
      return state
  }
}

// ─── Hook Options ───────────────────────────────────────────────────

export type UseOrderStreamOptions = {
  /** Called when a new order arrives that is relevant to this station */
  onNewOrder?: (order: Order) => void
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useOrderStream(station: Station, options?: UseOrderStreamOptions) {
  const [state, dispatch] = useReducer(orderReducer, {
    orders: [],
    connectionStatus: 'connecting',
  })

  const eventSourceRef = useRef<EventSource | null>(null)

  // Stable ref for callback — avoids re-creating SSE on every render
  const onNewOrderRef = useRef(options?.onNewOrder)
  onNewOrderRef.current = options?.onNewOrder

  // Fetch initial orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/orders?station=${station}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Order[] = await res.json()
      dispatch({ type: 'SET_ORDERS', payload: data })
    } catch (err) {
      console.error('[useOrderStream] Failed to fetch orders:', err)
    }
  }, [station])

  // Refetch (exposed for manual refresh)
  const refetch = useCallback(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    // Fetch initial data
    fetchOrders()

    // Open SSE connection
    const url = `/api/staff/orders/stream?station=${station}`
    console.log(`[useOrderStream] Connecting to SSE: ${url}`)
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onopen = () => {
      console.log('[useOrderStream] SSE connected')
      dispatch({ type: 'SET_CONNECTION', payload: 'connected' })
    }

    es.addEventListener('new-order', (event) => {
      try {
        const rawOrder: Order = JSON.parse(event.data)
        const filtered = filterOrderForStation(rawOrder, station)
        if (filtered) {
          console.log(`[useOrderStream] New order received: #${filtered.id}`)
          dispatch({ type: 'ADD_ORDER', payload: filtered })
          // Notify caller (e.g. for notification chime)
          onNewOrderRef.current?.(filtered)
        } else {
          console.log(`[useOrderStream] New order #${rawOrder.id} has no items for station=${station}, ignoring`)
        }
      } catch (err) {
        console.error('[useOrderStream] Failed to parse new-order event:', err)
      }
    })

    es.addEventListener('item-status-change', (event) => {
      try {
        const rawOrder: Order = JSON.parse(event.data)
        const filtered = filterOrderForStation(rawOrder, station)
        if (filtered) {
          console.log(`[useOrderStream] Item status change for order #${filtered.id}`)
          dispatch({ type: 'UPDATE_ORDER', payload: filtered })
        }
      } catch (err) {
        console.error('[useOrderStream] Failed to parse item-status-change event:', err)
      }
    })

    es.onerror = () => {
      console.error('[useOrderStream] SSE error — connection may be lost')
      dispatch({ type: 'SET_CONNECTION', payload: 'error' })
    }

    return () => {
      console.log('[useOrderStream] Closing SSE connection')
      es.close()
      eventSourceRef.current = null
      dispatch({ type: 'SET_CONNECTION', payload: 'disconnected' })
    }
  }, [station, fetchOrders])

  return {
    orders: state.orders,
    connectionStatus: state.connectionStatus,
    refetch,
  }
}
