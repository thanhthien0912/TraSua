/**
 * Unit tests for calculateOrderTotal — bill aggregation logic.
 *
 * Verifies correct total calculation across multi-order item arrays,
 * cancelled item exclusion, and edge cases.
 */

import { describe, it, expect } from 'vitest'
import { calculateOrderTotal } from '@/lib/order-status'

describe('calculateOrderTotal', () => {
  it('sums price * quantity for active items', () => {
    const items = [
      { status: 'PENDING', price: 30000, quantity: 2 },   // 60,000
      { status: 'PREPARING', price: 45000, quantity: 1 },  // 45,000
      { status: 'SERVED', price: 20000, quantity: 3 },     // 60,000
    ]
    expect(calculateOrderTotal(items)).toBe(165000)
  })

  it('excludes CANCELLED items from total', () => {
    const items = [
      { status: 'PENDING', price: 30000, quantity: 2 },    // 60,000
      { status: 'CANCELLED', price: 50000, quantity: 1 },  // excluded
      { status: 'READY', price: 25000, quantity: 1 },      // 25,000
    ]
    expect(calculateOrderTotal(items)).toBe(85000)
  })

  it('returns 0 for empty item array', () => {
    expect(calculateOrderTotal([])).toBe(0)
  })

  it('returns 0 when all items are CANCELLED', () => {
    const items = [
      { status: 'CANCELLED', price: 30000, quantity: 2 },
      { status: 'CANCELLED', price: 45000, quantity: 1 },
    ]
    expect(calculateOrderTotal(items)).toBe(0)
  })

  it('handles multi-order aggregation (flat item list from multiple orders)', () => {
    // Simulating items from Order #1 and Order #2 merged into one bill
    const order1Items = [
      { status: 'SERVED', price: 35000, quantity: 2 },    // 70,000
      { status: 'CANCELLED', price: 25000, quantity: 1 },  // excluded
    ]
    const order2Items = [
      { status: 'PENDING', price: 40000, quantity: 1 },   // 40,000
      { status: 'PREPARING', price: 55000, quantity: 2 },  // 110,000
    ]
    const allItems = [...order1Items, ...order2Items]
    expect(calculateOrderTotal(allItems)).toBe(220000)
  })

  it('handles single item correctly', () => {
    const items = [{ status: 'PENDING', price: 45000, quantity: 1 }]
    expect(calculateOrderTotal(items)).toBe(45000)
  })

  it('handles items with quantity > 1', () => {
    const items = [{ status: 'READY', price: 15000, quantity: 10 }]
    expect(calculateOrderTotal(items)).toBe(150000)
  })
})
