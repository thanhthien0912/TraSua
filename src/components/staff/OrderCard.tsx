'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { formatVND } from '@/lib/format'
import { getValidNextStatuses, type ItemStatus } from '@/lib/order-status'
import type { Order, OrderItem } from './useOrderStream'

// ─── Status Config ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ItemStatus,
  { label: string; bg: string; text: string; ring: string }
> = {
  PENDING: {
    label: 'Chờ',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    ring: 'ring-emerald-300',
  },
  PREPARING: {
    label: 'Đang pha',
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    ring: 'ring-teal-300',
  },
  READY: {
    label: 'Xong',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    ring: 'ring-emerald-300',
  },
  SERVED: {
    label: 'Đã phục vụ',
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    ring: 'ring-slate-300',
  },
  CANCELLED: {
    label: 'Huỷ',
    bg: 'bg-red-100',
    text: 'text-red-700',
    ring: 'ring-red-300',
  },
}

// ─── Derived Status Badge ───────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; dotColor: string }
> = {
  PENDING: { label: 'Chờ xử lý', dotColor: 'bg-emerald-400' },
  PREPARING: { label: 'Đang pha chế', dotColor: 'bg-teal-400' },
  READY: { label: 'Sẵn sàng', dotColor: 'bg-emerald-400' },
  SERVED: { label: 'Đã phục vụ', dotColor: 'bg-slate-400' },
  CANCELLED: { label: 'Đã huỷ', dotColor: 'bg-red-400' },
}

// ─── ItemRow ────────────────────────────────────────────────────────

/** Statuses that allow cancellation */
const CANCELLABLE_STATUSES: Set<ItemStatus> = new Set([
  'PENDING',
  'PREPARING',
  'READY',
])

function ItemRow({ item, orderId }: { item: OrderItem; orderId: number }) {
  const [loading, setLoading] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const status = item.status as ItemStatus
  const config = STATUS_CONFIG[status]
  const canCancel = CANCELLABLE_STATUSES.has(status)

  // Reset confirmation timeout after 3 seconds
  useEffect(() => {
    if (confirmingCancel) {
      cancelTimerRef.current = setTimeout(() => {
        setConfirmingCancel(false)
      }, 3000)
    }
    return () => {
      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current)
        cancelTimerRef.current = null
      }
    }
  }, [confirmingCancel])

  const handleAdvance = useCallback(
    async (targetStatus: ItemStatus) => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/staff/orders/${orderId}/items/${item.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: targetStatus }),
          }
        )
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          console.error(
            `[OrderCard] PATCH failed (${res.status}):`,
            err.error ?? 'Unknown error'
          )
        }
      } catch (err) {
        console.error('[OrderCard] Network error:', err)
      } finally {
        setLoading(false)
      }
    },
    [orderId, item.id]
  )

  const handleCancelTap = useCallback(async () => {
    if (!confirmingCancel) {
      setConfirmingCancel(true)
      return
    }
    setLoading(true)
    setConfirmingCancel(false)
    try {
      const res = await fetch(
        `/api/staff/orders/${orderId}/items/${item.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel' }),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error(
          `[OrderCard] Cancel failed (${res.status}):`,
          err.error ?? 'Unknown error'
        )
      }
    } catch (err) {
      console.error('[OrderCard] Cancel network error:', err)
    } finally {
      setLoading(false)
    }
  }, [confirmingCancel, orderId, item.id])

  return (
    <div className="flex items-center gap-3 py-3 border-b border-emerald-100 last:border-b-0">
      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base text-emerald-900 truncate">
            {item.menuItem.name}
          </span>
          <span className="text-emerald-600 font-medium text-sm flex-shrink-0">
            ×{item.quantity}
          </span>
        </div>
        {item.notes && (
          <p className="text-sm text-emerald-600/70 mt-0.5 truncate">
            📝 {item.notes}
          </p>
        )}
        <span className="text-xs text-emerald-500 mt-1 inline-block">
          {formatVND(item.menuItem.price * item.quantity)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-shrink-0">
        {status !== 'SERVED' && status !== 'CANCELLED' && (
          <button
            onClick={() => handleAdvance('SERVED')}
            disabled={loading}
            className="
              min-h-[44px] min-w-[80px] px-4 py-2 rounded-xl font-semibold text-sm
              transition-all duration-150 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-900/20
            "
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              'Xong'
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── OrderCard ──────────────────────────────────────────────────────

export default function OrderCard({ order, isNew }: { order: Order; isNew?: boolean }) {
  const derivedStatus = order.derivedStatus ?? order.status
  const orderStatusConfig = ORDER_STATUS_CONFIG[derivedStatus] ?? ORDER_STATUS_CONFIG.PENDING
  const timeStr = new Date(order.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-lg shadow-emerald-900/5 overflow-hidden transition-shadow duration-200 hover:shadow-xl hover:shadow-emerald-900/10${isNew ? ' animate-pulse-highlight' : ''}`}>
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-emerald-900">
              {order.table.name}
            </span>
            <span className="text-sm text-emerald-500 font-mono">
              #{order.id}
            </span>
          </div>
          <span className="text-xs text-emerald-500">{timeStr}</span>
        </div>
        <div className="mt-1">
          <span className="text-sm font-semibold text-emerald-700">
            {formatVND(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 py-2">
        {order.items.map((item) => (
          <ItemRow key={item.id} item={item} orderId={order.id} />
        ))}
      </div>
    </div>
  )
}
