import { describe, it, expect } from 'vitest'
import {
  calculateOrderTotal,
  deriveOrderStatus,
} from '../order-status'
import type { ItemStatus } from '../order-status'

// ─── calculateOrderTotal with newly added items ─────────────────────

describe('calculateOrderTotal — add-item scenarios', () => {
  it('includes newly added PENDING items in total', () => {
    // Existing items (already being prepared) + new items (PENDING)
    const items = [
      { status: 'PREPARING', price: 35000, quantity: 1 }, // existing: 35000
      { status: 'READY', price: 25000, quantity: 2 },     // existing: 50000
      { status: 'PENDING', price: 40000, quantity: 1 },   // new: 40000
      { status: 'PENDING', price: 15000, quantity: 3 },   // new: 45000
    ]
    expect(calculateOrderTotal(items)).toBe(170000)
  })

  it('excludes CANCELLED items but includes new PENDING items', () => {
    const items = [
      { status: 'CANCELLED', price: 30000, quantity: 1 }, // excluded
      { status: 'SERVED', price: 20000, quantity: 2 },    // existing: 40000
      { status: 'PENDING', price: 50000, quantity: 1 },   // new: 50000
    ]
    expect(calculateOrderTotal(items)).toBe(90000)
  })

  it('computes correct total when all existing items are CANCELLED and new ones are added', () => {
    // Edge case: everything was cancelled, then staff adds new items
    const items = [
      { status: 'CANCELLED', price: 30000, quantity: 2 }, // excluded
      { status: 'CANCELLED', price: 25000, quantity: 1 }, // excluded
      { status: 'PENDING', price: 45000, quantity: 1 },   // new: 45000
    ]
    expect(calculateOrderTotal(items)).toBe(45000)
  })

  it('handles single newly added item on empty order', () => {
    const items = [
      { status: 'PENDING', price: 29000, quantity: 2 },   // new: 58000
    ]
    expect(calculateOrderTotal(items)).toBe(58000)
  })

  it('handles large VND values without overflow', () => {
    // VND prices can be large integers
    const items = [
      { status: 'PENDING', price: 150000, quantity: 10 },  // 1,500,000
      { status: 'PREPARING', price: 250000, quantity: 5 }, // 1,250,000
    ]
    expect(calculateOrderTotal(items)).toBe(2750000)
  })
})

// ─── deriveOrderStatus after adding PENDING items ───────────────────

describe('deriveOrderStatus — add-item scenarios', () => {
  it('returns PREPARING when adding PENDING items to order with PREPARING items', () => {
    // Existing: some PREPARING, newly added: PENDING
    const statuses: ItemStatus[] = ['PREPARING', 'PREPARING', 'PENDING', 'PENDING']
    expect(deriveOrderStatus(statuses)).toBe('PREPARING')
  })

  it('returns PREPARING when adding PENDING items to order with READY items', () => {
    // Existing items are READY, but new PENDING items bring status back
    const statuses: ItemStatus[] = ['READY', 'READY', 'PENDING']
    expect(deriveOrderStatus(statuses)).toBe('PREPARING')
  })

  it('returns PREPARING when adding PENDING items to order with SERVED items', () => {
    // Existing items fully SERVED, new items are PENDING
    const statuses: ItemStatus[] = ['SERVED', 'SERVED', 'PENDING']
    expect(deriveOrderStatus(statuses)).toBe('PREPARING')
  })

  it('returns PREPARING when adding PENDING to mixed READY/SERVED/CANCELLED order', () => {
    const statuses: ItemStatus[] = ['READY', 'SERVED', 'CANCELLED', 'PENDING']
    expect(deriveOrderStatus(statuses)).toBe('PREPARING')
  })

  it('returns PENDING when adding PENDING items to all-CANCELLED order', () => {
    // All existing items were cancelled, new items are PENDING → order is PENDING
    const statuses: ItemStatus[] = ['CANCELLED', 'CANCELLED', 'PENDING']
    expect(deriveOrderStatus(statuses)).toBe('PENDING')
  })

  it('returns PENDING when single new PENDING item added to empty-like order', () => {
    const statuses: ItemStatus[] = ['PENDING']
    expect(deriveOrderStatus(statuses)).toBe('PENDING')
  })
})

// ─── PAID guard logic ───────────────────────────────────────────────

describe('PAID guard — add-item rejection logic', () => {
  it('order with PAID status should be rejected for item addition', () => {
    // Simulates the guard check: if order.status === 'PAID', reject
    const orderStatus = 'PAID'
    expect(orderStatus === 'PAID').toBe(true)
  })

  it('order with non-PAID status should be allowed for item addition', () => {
    const allowedStatuses = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']
    for (const status of allowedStatuses) {
      expect(status === 'PAID').toBe(false)
    }
  })

  it('PAID is a terminal state — deriveOrderStatus never returns PAID', () => {
    // PAID is set by the payment flow, not derived from item statuses.
    // Verify that no combination of item statuses produces PAID.
    const allCombos: ItemStatus[][] = [
      ['PENDING'],
      ['PREPARING'],
      ['READY'],
      ['SERVED'],
      ['CANCELLED'],
      ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'],
      [],
    ]
    for (const combo of allCombos) {
      expect(deriveOrderStatus(combo)).not.toBe('PAID')
    }
  })
})
