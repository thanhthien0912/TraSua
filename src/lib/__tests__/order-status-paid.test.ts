import { describe, it, expect } from 'vitest'
import {
  deriveOrderStatus,
  isValidTransition,
  getValidNextStatuses,
} from '../order-status'
import type { ItemStatus, OrderStatus } from '../order-status'

// ─── PAID as a valid OrderStatus ────────────────────────────────────

describe('PAID is a valid OrderStatus value', () => {
  it('PAID exists in the OrderStatus enum', () => {
    // PAID should be assignable as an OrderStatus — this is a compile-time
    // check materialized as a runtime assertion. If the enum didn't include
    // PAID, TypeScript would reject this assignment.
    const status: OrderStatus = 'PAID'
    expect(status).toBe('PAID')
  })
})

// ─── deriveOrderStatus never returns PAID ───────────────────────────

describe('deriveOrderStatus does NOT return PAID', () => {
  // PAID is an order-level override set by staff action, not derivable
  // from item progress. deriveOrderStatus should never produce it.

  const allItemStatuses: ItemStatus[] = [
    'PENDING',
    'PREPARING',
    'READY',
    'SERVED',
    'CANCELLED',
  ]

  it('never returns PAID for any single item status', () => {
    for (const status of allItemStatuses) {
      expect(deriveOrderStatus([status])).not.toBe('PAID')
    }
  })

  it('never returns PAID for all items SERVED', () => {
    expect(deriveOrderStatus(['SERVED', 'SERVED', 'SERVED'])).not.toBe('PAID')
  })

  it('never returns PAID for all items READY', () => {
    expect(deriveOrderStatus(['READY', 'READY'])).not.toBe('PAID')
  })

  it('never returns PAID for mixed statuses', () => {
    const mixedCombinations: ItemStatus[][] = [
      ['PENDING', 'PREPARING'],
      ['PREPARING', 'READY'],
      ['READY', 'SERVED'],
      ['PENDING', 'CANCELLED'],
      ['SERVED', 'CANCELLED'],
      ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'],
    ]

    for (const combo of mixedCombinations) {
      expect(deriveOrderStatus(combo)).not.toBe('PAID')
    }
  })

  it('never returns PAID for empty items', () => {
    expect(deriveOrderStatus([])).not.toBe('PAID')
  })
})

// ─── ItemStatus has no PAID value ───────────────────────────────────

describe('isValidTransition works without PAID in ItemStatus', () => {
  // ItemStatus enum: PENDING | PREPARING | READY | SERVED | CANCELLED
  // PAID does not exist in ItemStatus — these tests confirm existing
  // transitions remain intact and PAID is not part of item-level flow.

  const allItemStatuses: ItemStatus[] = [
    'PENDING',
    'PREPARING',
    'READY',
    'SERVED',
    'CANCELLED',
  ]

  it('forward transitions still work: PENDING→PREPARING→READY→SERVED', () => {
    expect(isValidTransition('PENDING', 'PREPARING')).toBe(true)
    expect(isValidTransition('PREPARING', 'READY')).toBe(true)
    expect(isValidTransition('READY', 'SERVED')).toBe(true)
  })

  it('cancellation from any non-terminal status still works', () => {
    expect(isValidTransition('PENDING', 'CANCELLED')).toBe(true)
    expect(isValidTransition('PREPARING', 'CANCELLED')).toBe(true)
    expect(isValidTransition('READY', 'CANCELLED')).toBe(true)
    expect(isValidTransition('SERVED', 'CANCELLED')).toBe(true)
  })

  it('CANCELLED remains terminal', () => {
    for (const target of allItemStatuses) {
      expect(isValidTransition('CANCELLED', target)).toBe(false)
    }
  })

  it('getValidNextStatuses returns expected arrays for all item statuses', () => {
    expect(getValidNextStatuses('PENDING')).toEqual(['PREPARING', 'CANCELLED'])
    expect(getValidNextStatuses('PREPARING')).toEqual(['READY', 'CANCELLED'])
    expect(getValidNextStatuses('READY')).toEqual(['SERVED', 'CANCELLED'])
    expect(getValidNextStatuses('SERVED')).toEqual(['CANCELLED'])
    expect(getValidNextStatuses('CANCELLED')).toEqual([])
  })
})
