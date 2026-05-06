'use client'

import { useState, useCallback } from 'react'
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
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    ring: 'ring-amber-300',
  },
  PREPARING: {
    label: 'Đang pha',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    ring: 'ring-orange-300',
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

/** Vietnamese action labels for status transitions */
const ACTION_LABELS: Partial<Record<ItemStatus, string>> = {
  PREPARING: 'Nhận đơn',
  READY: 'Xong',
  SERVED: 'Phục vụ',
}

// ─── Derived Status Badge ───────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; dotColor: string }
> = {
  PENDING: { label: 'Chờ xử lý', dotColor: 'bg-amber-400' },
  PREPARING: { label: 'Đang pha chế', dotColor: 'bg-orange-400' },
  READY: { label: 'Sẵn sàng', dotColor: 'bg-emerald-400' },
  SERVED: { label: 'Đã phục vụ', dotColor: 'bg-slate-400' },
  CANCELLED: { label: 'Đã huỷ', dotColor: 'bg-red-400' },
}

// ─── ItemRow ────────────────────────────────────────────────────────

function ItemRow({ item, orderId }: { item: OrderItem; orderId: number }) {
  const [loading, setLoading] = useState(false)
  const status = item.status as ItemStatus
  const config = STATUS_CONFIG[status]
  const nextStatuses = getValidNextStatuses(status).filter(
    (s) => s !== 'CANCELLED'
  )

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

  return (
    <div className="flex items-center gap-3 py-3 border-b border-amber-100 last:border-b-0">
      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base truncate">
            {item.menuItem.name}
          </span>
          <span className="text-amber-600 font-medium text-sm flex-shrink-0">
            ×{item.quantity}
          </span>
        </div>
        {item.notes && (
          <p className="text-sm text-amber-600/70 mt-0.5 italic truncate">
            📝 {item.notes}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${config.bg} ${config.text} ${config.ring}`}
          >
            {config.label}
          </span>
          <span className="text-xs text-amber-500">
            {formatVND(item.menuItem.price * item.quantity)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-shrink-0">
        {nextStatuses.map((targetStatus) => {
          const actionLabel =
            ACTION_LABELS[targetStatus] ?? targetStatus
          const isPrimary = targetStatus === 'PREPARING' || targetStatus === 'READY'
          return (
            <button
              key={targetStatus}
              onClick={() => handleAdvance(targetStatus)}
              disabled={loading}
              className={`
                min-h-[44px] min-w-[80px] px-4 py-2 rounded-xl font-semibold text-sm
                transition-all duration-150 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  isPrimary
                    ? 'bg-amber-700 text-amber-50 hover:bg-amber-800 shadow-md shadow-amber-900/20'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200 ring-1 ring-inset ring-amber-300'
                }
              `}
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                actionLabel
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── OrderCard ──────────────────────────────────────────────────────

export default function OrderCard({ order }: { order: Order }) {
  const derivedStatus = order.derivedStatus ?? order.status
  const orderStatusConfig = ORDER_STATUS_CONFIG[derivedStatus] ?? ORDER_STATUS_CONFIG.PENDING
  const timeStr = new Date(order.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/60 shadow-lg shadow-amber-900/5 overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-amber-900/10">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-amber-900">
              {order.table.name}
            </span>
            <span className="text-sm text-amber-500 font-mono">
              #{order.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${orderStatusConfig.dotColor} animate-pulse`}
            />
            <span className="text-xs font-medium text-amber-600">
              {orderStatusConfig.label}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-amber-500">{timeStr}</span>
          <span className="text-sm font-semibold text-amber-700">
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
