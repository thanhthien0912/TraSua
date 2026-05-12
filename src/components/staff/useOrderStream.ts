'use client'

import { useEffect, useReducer, useCallback, useRef } from 'react'
import type { ItemStatus } from '@/lib/order-status'

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

export type OrderState = {
  orders: Order[]
  connectionStatus: ConnectionStatus
}

export type OrderAction =
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'SET_CONNECTION'; payload: ConnectionStatus }

export function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_ORDERS':
      return { ...state, orders: action.payload, connectionStatus: 'connected' }
    case 'SET_CONNECTION':
      return { ...state, connectionStatus: action.payload }
    default:
      return state
  }
}

export type UseOrderStreamOptions = {
  onNewOrder?: (order: Order) => void
}

export function useOrderStream(station: Station, options?: UseOrderStreamOptions) {
  const [state, dispatch] = useReducer(orderReducer, {
    orders: [],
    connectionStatus: 'connecting',
  })

  const prevOrdersCountRef = useRef<number>(0)
  const onNewOrderRef = useRef(options?.onNewOrder)
  onNewOrderRef.current = options?.onNewOrder

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/orders?station=${station}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Order[] = await res.json()
      
      // Kiểm tra xem có đơn mới không để báo chuông
      if (data.length > prevOrdersCountRef.current) {
        const newOrders = data.filter(o => !state.orders.some(prev => prev.id === o.id))
        newOrders.forEach(o => onNewOrderRef.current?.(o))
      }
      prevOrdersCountRef.current = data.length
      
      dispatch({ type: 'SET_ORDERS', payload: data })
    } catch (err) {
      console.error('[useOrderStream] Polling failed:', err)
      dispatch({ type: 'SET_CONNECTION', payload: 'error' })
    }
  }, [station, state.orders])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000) // Polling mỗi 10 giây để tiết kiệm Vercel Function Invocations
    return () => clearInterval(interval)
  }, [fetchOrders])

  return {
    orders: state.orders,
    connectionStatus: state.connectionStatus,
    refetch: fetchOrders,
  }
}
