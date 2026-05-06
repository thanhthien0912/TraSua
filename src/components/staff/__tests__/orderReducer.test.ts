/**
 * Unit tests for useOrderStream reducer — particularly REMOVE_ORDERS action.
 *
 * Tests the pure reducer function without React hooks.
 */

import { orderReducer } from '../useOrderStream'
import type { OrderState, Order } from '../useOrderStream'

// Minimal order factory — only fields the reducer uses
function makeOrder(id: number, tableId = 1): Order {
  return {
    id,
    tableId,
    table: { id: tableId, number: tableId, name: `Bàn ${tableId}` },
    status: 'PENDING',
    derivedStatus: 'PENDING',
    totalAmount: 50000,
    createdAt: new Date().toISOString(),
    items: [],
  }
}

function makeState(orders: Order[]): OrderState {
  return { orders, connectionStatus: 'connected' }
}

describe('orderReducer', () => {
  describe('REMOVE_ORDERS', () => {
    it('removes orders by ID array', () => {
      const state = makeState([makeOrder(1), makeOrder(2), makeOrder(3)])
      const result = orderReducer(state, {
        type: 'REMOVE_ORDERS',
        payload: [1, 2],
      })

      expect(result.orders).toHaveLength(1)
      expect(result.orders[0].id).toBe(3)
    })

    it('does nothing when no IDs match', () => {
      const state = makeState([makeOrder(1), makeOrder(2)])
      const result = orderReducer(state, {
        type: 'REMOVE_ORDERS',
        payload: [99, 100],
      })

      expect(result.orders).toHaveLength(2)
    })

    it('removes all orders when all IDs match', () => {
      const state = makeState([makeOrder(1), makeOrder(2)])
      const result = orderReducer(state, {
        type: 'REMOVE_ORDERS',
        payload: [1, 2],
      })

      expect(result.orders).toHaveLength(0)
    })

    it('handles empty payload array', () => {
      const state = makeState([makeOrder(1), makeOrder(2)])
      const result = orderReducer(state, {
        type: 'REMOVE_ORDERS',
        payload: [],
      })

      expect(result.orders).toHaveLength(2)
    })

    it('preserves connection status', () => {
      const state: OrderState = {
        orders: [makeOrder(1), makeOrder(2)],
        connectionStatus: 'error',
      }
      const result = orderReducer(state, {
        type: 'REMOVE_ORDERS',
        payload: [1],
      })

      expect(result.connectionStatus).toBe('error')
    })
  })

  describe('ADD_ORDER', () => {
    it('adds new order at the top', () => {
      const state = makeState([makeOrder(1)])
      const result = orderReducer(state, {
        type: 'ADD_ORDER',
        payload: makeOrder(2),
      })

      expect(result.orders).toHaveLength(2)
      expect(result.orders[0].id).toBe(2)
    })

    it('updates existing order instead of duplicating', () => {
      const state = makeState([makeOrder(1)])
      const updated = { ...makeOrder(1), totalAmount: 99000 }
      const result = orderReducer(state, {
        type: 'ADD_ORDER',
        payload: updated,
      })

      expect(result.orders).toHaveLength(1)
      expect(result.orders[0].totalAmount).toBe(99000)
    })
  })

  describe('UPDATE_ORDER', () => {
    it('updates existing order in place', () => {
      const state = makeState([makeOrder(1), makeOrder(2)])
      const updated = { ...makeOrder(2), totalAmount: 75000 }
      const result = orderReducer(state, {
        type: 'UPDATE_ORDER',
        payload: updated,
      })

      expect(result.orders).toHaveLength(2)
      expect(result.orders[1].totalAmount).toBe(75000)
    })
  })

  describe('SET_ORDERS', () => {
    it('replaces all orders', () => {
      const state = makeState([makeOrder(1)])
      const result = orderReducer(state, {
        type: 'SET_ORDERS',
        payload: [makeOrder(5), makeOrder(6)],
      })

      expect(result.orders).toHaveLength(2)
      expect(result.orders[0].id).toBe(5)
    })
  })
})
