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
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    ring: 'ring-orange-300',
  },
  PREPARING: {
    label: 'Đang pha',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    ring: 'ring-blue-300',
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
  PENDING: { label: 'Chờ xử lý', dotColor: 'bg-orange-400' },
  PREPARING: { label: 'Đang pha chế', dotColor: 'bg-blue-400' },
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

function ItemRow({ item, orderId, showPrice }: { item: OrderItem; orderId: number; showPrice: boolean }) {
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
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base text-foreground truncate">
            {item.menuItem.name}
          </span>
          <span className="text-primary font-medium text-sm flex-shrink-0">
            ×{item.quantity}
          </span>
        </div>
        <span className="text-xs text-foreground/50 mt-1 inline-block">
          {showPrice && formatVND(item.menuItem.price * item.quantity)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-shrink-0">
        {status !== 'SERVED' && status !== 'CANCELLED' && (
          <button
            onClick={() => handleAdvance('SERVED')}
            disabled={loading}
            className="
              min-h-[52px] min-w-[100px] px-6 py-2 rounded-2xl font-black text-base
              transition-all duration-150 active:scale-90
              disabled:opacity-50
              bg-[#27ae60] text-white shadow-[0_4px_0_0_#1e8449] active:shadow-none active:translate-y-[4px]
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

export default function OrderCard({ order, isNew, dimmed, faded, showPrice = true }: { order: Order; isNew?: boolean; dimmed?: boolean; faded?: boolean; showPrice?: boolean }) {
  const derivedStatus = order.derivedStatus ?? order.status
  const timeStr = new Date(order.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all
      ${isNew ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border'}
      ${dimmed ? 'opacity-50' : ''}
      ${faded ? 'grayscale' : ''}
    `}>
      {/* Header */}
      <div className="px-4 py-3 bg-secondary/30 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-black text-lg text-foreground">{order.table.name}</span>
          <span className="text-[10px] font-black text-foreground/30 font-mono">#{order.id}</span>
        </div>
        <div className="text-right">
          {showPrice && <p className="font-black text-base text-primary tabular-nums">{formatVND(order.totalAmount)}</p>}
          <p className="text-[10px] font-bold text-foreground/30">{timeStr}</p>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-2">
        {order.items.map((item) => (
          <ItemRow key={item.id} item={item} orderId={order.id} showPrice={showPrice} />
        ))}
      </div>
    </div>
  )

}
