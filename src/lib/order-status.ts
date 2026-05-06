/**
 * Order Status Derivation & Item Status Transition Validation
 *
 * Pure functions — no side effects, no DB access.
 * Imported by API routes and UI components alike.
 */

import type { ItemStatus, OrderStatus } from '../../generated/prisma/enums'

// Re-export for convenience so consumers don't need to import from generated
export type { ItemStatus, OrderStatus }

// ─── Status Derivation ──────────────────────────────────────────────

/**
 * Derive the overall order status from its item statuses.
 *
 * Rules (evaluated in priority order):
 * 1. Empty array → PENDING (no items = nothing to process)
 * 2. ALL items CANCELLED → CANCELLED
 * 3. ALL non-cancelled items SERVED → SERVED
 * 4. ALL non-cancelled items READY → READY
 * 5. ANY non-cancelled item PREPARING → PREPARING
 * 6. Otherwise → PENDING
 */
export function deriveOrderStatus(itemStatuses: ItemStatus[]): OrderStatus {
  if (itemStatuses.length === 0) return 'PENDING'

  const nonCancelled = itemStatuses.filter((s) => s !== 'CANCELLED')

  // All cancelled
  if (nonCancelled.length === 0) return 'CANCELLED'

  // All non-cancelled are SERVED
  if (nonCancelled.every((s) => s === 'SERVED')) return 'SERVED'

  // All non-cancelled are READY (or SERVED — already handled above means some READY)
  if (nonCancelled.every((s) => s === 'READY' || s === 'SERVED')) return 'READY'

  // Any non-cancelled is PREPARING (or beyond — READY/SERVED)
  if (
    nonCancelled.some(
      (s) => s === 'PREPARING' || s === 'READY' || s === 'SERVED'
    )
  )
    return 'PREPARING'

  // Default: all non-cancelled items are PENDING
  return 'PENDING'
}

// ─── Total Recalculation ────────────────────────────────────────────

/**
 * Calculate the order total from item data, excluding CANCELLED items.
 * Prices are Int (VND — no decimals).
 */
export function calculateOrderTotal(
  items: Array<{ status: string; price: number; quantity: number }>
): number {
  return items.reduce((sum, item) => {
    if (item.status === 'CANCELLED') return sum
    return sum + item.price * item.quantity
  }, 0)
}

// ─── Transition Validation ──────────────────────────────────────────

/**
 * Valid forward transitions for item statuses.
 * PENDING → PREPARING → READY → SERVED (forward-only)
 * Any status → CANCELLED (always allowed)
 */
const VALID_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVED', 'CANCELLED'],
  SERVED: ['CANCELLED'],
  CANCELLED: [], // Terminal — no transitions out
}

/**
 * Check whether transitioning from one item status to another is valid.
 * Forward-only: PENDING → PREPARING → READY → SERVED
 * Plus: any status → CANCELLED (except CANCELLED itself)
 */
export function isValidTransition(
  from: ItemStatus,
  to: ItemStatus
): boolean {
  if (from === to) return false // No-op transitions are invalid
  const allowed = VALID_TRANSITIONS[from]
  return allowed !== undefined && allowed.includes(to)
}

/**
 * Get the list of valid next statuses for a given item status.
 * Useful for UI to render available action buttons.
 */
export function getValidNextStatuses(current: ItemStatus): ItemStatus[] {
  return VALID_TRANSITIONS[current] ?? []
}
