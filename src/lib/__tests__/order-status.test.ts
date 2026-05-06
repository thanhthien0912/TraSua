import { describe, it, expect } from 'vitest'
import {
  deriveOrderStatus,
  isValidTransition,
  getValidNextStatuses,
} from '../order-status'
import type { ItemStatus } from '../order-status'

// ─── deriveOrderStatus ──────────────────────────────────────────────

describe('deriveOrderStatus', () => {
  it('returns PENDING for empty array', () => {
    expect(deriveOrderStatus([])).toBe('PENDING')
  })

  it('returns PENDING when all items are PENDING', () => {
    expect(deriveOrderStatus(['PENDING', 'PENDING', 'PENDING'])).toBe(
      'PENDING'
    )
  })

  it('returns PREPARING when any item is PREPARING', () => {
    expect(deriveOrderStatus(['PENDING', 'PREPARING'])).toBe('PREPARING')
  })

  it('returns PREPARING when mix of PREPARING and READY', () => {
    expect(deriveOrderStatus(['PREPARING', 'READY'])).toBe('PREPARING')
  })

  it('returns PREPARING when PENDING + READY (some still behind)', () => {
    // PENDING items haven't started, but READY items have been through PREPARING
    // The order is still "in progress" → PREPARING
    expect(deriveOrderStatus(['PENDING', 'READY'])).toBe('PREPARING')
  })

  it('returns READY when all non-cancelled items are READY', () => {
    expect(deriveOrderStatus(['READY', 'READY'])).toBe('READY')
  })

  it('returns READY when mix of READY and CANCELLED', () => {
    expect(deriveOrderStatus(['READY', 'CANCELLED', 'READY'])).toBe('READY')
  })

  it('returns READY when mix of READY and SERVED', () => {
    expect(deriveOrderStatus(['READY', 'SERVED'])).toBe('READY')
  })

  it('returns SERVED when all non-cancelled items are SERVED', () => {
    expect(deriveOrderStatus(['SERVED', 'SERVED'])).toBe('SERVED')
  })

  it('returns SERVED when mix of SERVED and CANCELLED', () => {
    expect(deriveOrderStatus(['SERVED', 'CANCELLED'])).toBe('SERVED')
  })

  it('returns CANCELLED when all items are CANCELLED', () => {
    expect(deriveOrderStatus(['CANCELLED', 'CANCELLED'])).toBe('CANCELLED')
  })

  it('returns CANCELLED for single CANCELLED item', () => {
    expect(deriveOrderStatus(['CANCELLED'])).toBe('CANCELLED')
  })

  // Complex mixed scenarios
  it('returns PREPARING for mixed bag: PENDING + PREPARING + CANCELLED', () => {
    expect(
      deriveOrderStatus(['PENDING', 'PREPARING', 'CANCELLED'])
    ).toBe('PREPARING')
  })

  it('returns PREPARING for: PENDING + READY + SERVED + CANCELLED', () => {
    expect(
      deriveOrderStatus(['PENDING', 'READY', 'SERVED', 'CANCELLED'])
    ).toBe('PREPARING')
  })

  it('returns READY for: READY + SERVED + CANCELLED', () => {
    expect(
      deriveOrderStatus(['READY', 'SERVED', 'CANCELLED'])
    ).toBe('READY')
  })

  it('handles single PENDING item', () => {
    expect(deriveOrderStatus(['PENDING'])).toBe('PENDING')
  })

  it('handles single PREPARING item', () => {
    expect(deriveOrderStatus(['PREPARING'])).toBe('PREPARING')
  })

  it('handles single READY item', () => {
    expect(deriveOrderStatus(['READY'])).toBe('READY')
  })

  it('handles single SERVED item', () => {
    expect(deriveOrderStatus(['SERVED'])).toBe('SERVED')
  })
})

// ─── isValidTransition ──────────────────────────────────────────────

describe('isValidTransition', () => {
  // Forward transitions
  it('allows PENDING → PREPARING', () => {
    expect(isValidTransition('PENDING', 'PREPARING')).toBe(true)
  })

  it('allows PREPARING → READY', () => {
    expect(isValidTransition('PREPARING', 'READY')).toBe(true)
  })

  it('allows READY → SERVED', () => {
    expect(isValidTransition('READY', 'SERVED')).toBe(true)
  })

  // Cancellation from any state
  it('allows PENDING → CANCELLED', () => {
    expect(isValidTransition('PENDING', 'CANCELLED')).toBe(true)
  })

  it('allows PREPARING → CANCELLED', () => {
    expect(isValidTransition('PREPARING', 'CANCELLED')).toBe(true)
  })

  it('allows READY → CANCELLED', () => {
    expect(isValidTransition('READY', 'CANCELLED')).toBe(true)
  })

  it('allows SERVED → CANCELLED', () => {
    expect(isValidTransition('SERVED', 'CANCELLED')).toBe(true)
  })

  // Backward transitions (must be rejected)
  it('rejects PREPARING → PENDING (backward)', () => {
    expect(isValidTransition('PREPARING', 'PENDING')).toBe(false)
  })

  it('rejects READY → PREPARING (backward)', () => {
    expect(isValidTransition('READY', 'PREPARING')).toBe(false)
  })

  it('rejects SERVED → READY (backward)', () => {
    expect(isValidTransition('SERVED', 'READY')).toBe(false)
  })

  it('rejects READY → PENDING (skip backward)', () => {
    expect(isValidTransition('READY', 'PENDING')).toBe(false)
  })

  // Skip-forward transitions (must be rejected)
  it('rejects PENDING → READY (skip forward)', () => {
    expect(isValidTransition('PENDING', 'READY')).toBe(false)
  })

  it('rejects PENDING → SERVED (skip forward)', () => {
    expect(isValidTransition('PENDING', 'SERVED')).toBe(false)
  })

  it('rejects PREPARING → SERVED (skip forward)', () => {
    expect(isValidTransition('PREPARING', 'SERVED')).toBe(false)
  })

  // No-op transitions (same → same)
  it('rejects PENDING → PENDING (no-op)', () => {
    expect(isValidTransition('PENDING', 'PENDING')).toBe(false)
  })

  it('rejects PREPARING → PREPARING (no-op)', () => {
    expect(isValidTransition('PREPARING', 'PREPARING')).toBe(false)
  })

  // CANCELLED is terminal
  it('rejects CANCELLED → PENDING', () => {
    expect(isValidTransition('CANCELLED', 'PENDING')).toBe(false)
  })

  it('rejects CANCELLED → PREPARING', () => {
    expect(isValidTransition('CANCELLED', 'PREPARING')).toBe(false)
  })

  it('rejects CANCELLED → CANCELLED', () => {
    expect(isValidTransition('CANCELLED', 'CANCELLED')).toBe(false)
  })
})

// ─── getValidNextStatuses ───────────────────────────────────────────

describe('getValidNextStatuses', () => {
  it('returns [PREPARING, CANCELLED] for PENDING', () => {
    expect(getValidNextStatuses('PENDING')).toEqual(['PREPARING', 'CANCELLED'])
  })

  it('returns [READY, CANCELLED] for PREPARING', () => {
    expect(getValidNextStatuses('PREPARING')).toEqual(['READY', 'CANCELLED'])
  })

  it('returns [SERVED, CANCELLED] for READY', () => {
    expect(getValidNextStatuses('READY')).toEqual(['SERVED', 'CANCELLED'])
  })

  it('returns [CANCELLED] for SERVED', () => {
    expect(getValidNextStatuses('SERVED')).toEqual(['CANCELLED'])
  })

  it('returns empty array for CANCELLED (terminal)', () => {
    expect(getValidNextStatuses('CANCELLED')).toEqual([])
  })
})
