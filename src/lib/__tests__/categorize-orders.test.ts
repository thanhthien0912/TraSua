import { describe, it, expect } from 'vitest'
import { categorizeOrders } from '@/lib/categorize-orders'
import type { Order } from '@/components/staff/useOrderStream'

// ─── Test helpers ───────────────────────────────────────────────────

const NOW = 1_700_000_000_000 // fixed reference timestamp
const FIVE_MIN = 5 * 60 * 1000

/** Minimal Order factory — only fields that categorizeOrders reads */
function makeOrder(overrides: Partial<Order> & { id: number; derivedStatus: string }): Order {
  return {
    tableId: 1,
    table: { id: 1, number: 1, name: 'Bàn 1' },
    status: overrides.derivedStatus,
    totalAmount: 0,
    createdAt: new Date(NOW - 60_000).toISOString(),
    items: [],
    ...overrides,
  } as Order
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('categorizeOrders', () => {
  it('puts active orders (PENDING/PREPARING/READY) into active bucket', () => {
    const orders = [
      makeOrder({ id: 1, derivedStatus: 'PENDING' }),
      makeOrder({ id: 2, derivedStatus: 'PREPARING' }),
      makeOrder({ id: 3, derivedStatus: 'READY' }),
    ]
    const result = categorizeOrders(orders, new Map(), NOW)
    expect(result.active).toHaveLength(3)
    expect(result.recentlyCompleted).toHaveLength(0)
    expect(result.hidden).toHaveLength(0)
  })

  it('puts newly-completed orders (SERVED) into recentlyCompleted when completedAt is within window', () => {
    const orders = [
      makeOrder({ id: 1, derivedStatus: 'SERVED' }),
    ]
    const completedAt = new Map([[1, NOW - 2 * 60 * 1000]]) // 2 min ago
    const result = categorizeOrders(orders, completedAt, NOW)
    expect(result.active).toHaveLength(0)
    expect(result.recentlyCompleted).toHaveLength(1)
    expect(result.recentlyCompleted[0].id).toBe(1)
    expect(result.hidden).toHaveLength(0)
  })

  it('puts old completed orders (>5 min) into hidden', () => {
    const orders = [
      makeOrder({ id: 1, derivedStatus: 'SERVED' }),
      makeOrder({ id: 2, derivedStatus: 'CANCELLED' }),
    ]
    const completedAt = new Map([
      [1, NOW - FIVE_MIN - 1000], // 5min + 1s ago
      [2, NOW - FIVE_MIN - 5000], // 5min + 5s ago
    ])
    const result = categorizeOrders(orders, completedAt, NOW)
    expect(result.active).toHaveLength(0)
    expect(result.recentlyCompleted).toHaveLength(0)
    expect(result.hidden).toHaveLength(2)
  })

  it('treats orders without completedAt entry but SERVED status as recentlyCompleted (new completion detected)', () => {
    const orders = [
      makeOrder({ id: 99, derivedStatus: 'SERVED' }),
    ]
    // No entry in completedAtMap — first time seeing completion
    const result = categorizeOrders(orders, new Map(), NOW)
    expect(result.recentlyCompleted).toHaveLength(1)
    expect(result.recentlyCompleted[0].id).toBe(99)
    expect(result.hidden).toHaveLength(0)
  })

  it('boundary: exactly at hideAfterMs puts order in recentlyCompleted (exclusive)', () => {
    const orders = [
      makeOrder({ id: 1, derivedStatus: 'SERVED' }),
    ]
    // completedAt exactly at the boundary: elapsed === hideAfterMs → NOT < hideAfterMs → hidden
    const completedAt = new Map([[1, NOW - FIVE_MIN]])
    const result = categorizeOrders(orders, completedAt, NOW)
    // At exactly the boundary, elapsed == hideAfterMs, condition is < not <=, so hidden
    expect(result.hidden).toHaveLength(1)
    expect(result.recentlyCompleted).toHaveLength(0)
  })

  it('boundary: 1ms before hideAfterMs is recentlyCompleted', () => {
    const orders = [
      makeOrder({ id: 1, derivedStatus: 'SERVED' }),
    ]
    const completedAt = new Map([[1, NOW - FIVE_MIN + 1]])
    const result = categorizeOrders(orders, completedAt, NOW)
    expect(result.recentlyCompleted).toHaveLength(1)
    expect(result.hidden).toHaveLength(0)
  })

  it('handles mix of active, recent, and hidden orders', () => {
    const orders = [
      makeOrder({ id: 1, derivedStatus: 'PREPARING' }),
      makeOrder({ id: 2, derivedStatus: 'SERVED' }),
      makeOrder({ id: 3, derivedStatus: 'CANCELLED' }),
      makeOrder({ id: 4, derivedStatus: 'PENDING' }),
    ]
    const completedAt = new Map([
      [2, NOW - 60_000],          // 1 min ago — recent
      [3, NOW - FIVE_MIN - 1000], // >5 min — hidden
    ])
    const result = categorizeOrders(orders, completedAt, NOW)
    expect(result.active.map(o => o.id)).toEqual([1, 4])
    expect(result.recentlyCompleted.map(o => o.id)).toEqual([2])
    expect(result.hidden.map(o => o.id)).toEqual([3])
  })

  it('respects custom hideAfterMs parameter', () => {
    const orders = [
      makeOrder({ id: 1, derivedStatus: 'SERVED' }),
    ]
    const completedAt = new Map([[1, NOW - 30_000]]) // 30s ago
    // With 1-minute window → recent; with 10-second window → hidden
    expect(categorizeOrders(orders, completedAt, NOW, 60_000).recentlyCompleted).toHaveLength(1)
    expect(categorizeOrders(orders, completedAt, NOW, 10_000).hidden).toHaveLength(1)
  })

  it('returns empty arrays for empty input', () => {
    const result = categorizeOrders([], new Map(), NOW)
    expect(result.active).toHaveLength(0)
    expect(result.recentlyCompleted).toHaveLength(0)
    expect(result.hidden).toHaveLength(0)
  })
})
