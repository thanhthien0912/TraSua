import { describe, it, expect } from 'vitest'
import { calculateOrderTotal } from '../order-status'

describe('calculateOrderTotal', () => {
  it('excludes cancelled items from total', () => {
    const items = [
      { status: 'PENDING', price: 30000, quantity: 2 },   // 60000
      { status: 'CANCELLED', price: 25000, quantity: 1 },  // excluded
      { status: 'PREPARING', price: 15000, quantity: 3 },  // 45000
    ]
    expect(calculateOrderTotal(items)).toBe(105000)
  })

  it('returns 0 when all items are cancelled', () => {
    const items = [
      { status: 'CANCELLED', price: 30000, quantity: 2 },
      { status: 'CANCELLED', price: 25000, quantity: 1 },
    ]
    expect(calculateOrderTotal(items)).toBe(0)
  })

  it('sums all items when none are cancelled', () => {
    const items = [
      { status: 'PENDING', price: 30000, quantity: 2 },    // 60000
      { status: 'PREPARING', price: 25000, quantity: 1 },   // 25000
      { status: 'READY', price: 15000, quantity: 3 },       // 45000
    ]
    expect(calculateOrderTotal(items)).toBe(130000)
  })

  it('returns 0 when single item is cancelled', () => {
    const items = [
      { status: 'CANCELLED', price: 50000, quantity: 1 },
    ]
    expect(calculateOrderTotal(items)).toBe(0)
  })

  it('handles items with price=0 correctly', () => {
    const items = [
      { status: 'PENDING', price: 0, quantity: 5 },
      { status: 'CANCELLED', price: 30000, quantity: 1 },
    ]
    expect(calculateOrderTotal(items)).toBe(0)
  })

  it('returns 0 for empty items array', () => {
    expect(calculateOrderTotal([])).toBe(0)
  })

  it('handles quantity > 1 correctly', () => {
    const items = [
      { status: 'READY', price: 45000, quantity: 3 },  // 135000
    ]
    expect(calculateOrderTotal(items)).toBe(135000)
  })

  it('handles mixed statuses including SERVED', () => {
    const items = [
      { status: 'SERVED', price: 30000, quantity: 1 },     // 30000
      { status: 'CANCELLED', price: 25000, quantity: 2 },   // excluded
      { status: 'READY', price: 20000, quantity: 1 },       // 20000
    ]
    expect(calculateOrderTotal(items)).toBe(50000)
  })
})
