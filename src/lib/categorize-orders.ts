/**
 * Time-based order categorization for station views.
 *
 * Pure function — no side effects, no timers, fully testable.
 * Used by StationView to bucket orders into active/recentlyCompleted/hidden.
 */

import type { Order } from '@/components/staff/useOrderStream'

export type CategorizedOrders = {
  /** Orders still being processed (not SERVED/CANCELLED) */
  active: Order[]
  /** Completed orders within the hide-after window */
  recentlyCompleted: Order[]
  /** Completed orders past the hide-after window */
  hidden: Order[]
}

const COMPLETED_STATUSES = new Set(['SERVED', 'CANCELLED'])

/**
 * Split orders into three buckets based on derived status and completion time.
 *
 * @param orders          - All orders from useOrderStream
 * @param completedAtMap  - Map<orderId, timestamp> tracking when each order first became SERVED/CANCELLED
 * @param now             - Current timestamp (ms) — injected for testability
 * @param hideAfterMs     - How long completed orders stay visible (default 5 minutes)
 */
export function categorizeOrders(
  orders: Order[],
  completedAtMap: Map<number, number>,
  now: number,
  hideAfterMs: number = 5 * 60 * 1000
): CategorizedOrders {
  const active: Order[] = []
  const recentlyCompleted: Order[] = []
  const hidden: Order[] = []

  for (const order of orders) {
    const status = order.derivedStatus ?? order.status
    if (!COMPLETED_STATUSES.has(status)) {
      active.push(order)
      continue
    }

    // Order is SERVED or CANCELLED
    const completedAt = completedAtMap.get(order.id)
    if (completedAt == null) {
      // First time seeing this order as completed — treat as recently completed
      // (caller records the timestamp on the next tick)
      recentlyCompleted.push(order)
      continue
    }

    const elapsed = now - completedAt
    if (elapsed < hideAfterMs) {
      recentlyCompleted.push(order)
    } else {
      hidden.push(order)
    }
  }

  return { active, recentlyCompleted, hidden }
}
