'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { formatVND } from '@/lib/format'
import type { ItemStatus } from '@/lib/order-status'

// ─── Types ──────────────────────────────────────────────────────────

interface BillItem {
  id: number
  orderId: number
  menuItemId: number
  name: string
  category: string
  price: number
  quantity: number
  status: string
  notes: string | null
}

interface BillData {
  table: { id: number; number: number; name: string }
  orders: Array<{ id: number }>
  items: BillItem[]
  total: number
}

// ─── Status Config (simplified for bill view) ───────────────────────

const ITEM_STATUS_DISPLAY: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  PENDING: { label: 'Chờ', bg: 'bg-amber-100', text: 'text-amber-800' },
  PREPARING: { label: 'Đang pha', bg: 'bg-orange-100', text: 'text-orange-800' },
  READY: { label: 'Xong', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  SERVED: { label: 'Đã phục vụ', bg: 'bg-slate-100', text: 'text-slate-500' },
  CANCELLED: { label: 'Huỷ', bg: 'bg-red-100', text: 'text-red-700' },
}

const CANCELLABLE_STATUSES: Set<string> = new Set([
  'PENDING',
  'PREPARING',
  'READY',
])

// ─── BillItemRow ────────────────────────────────────────────────────

function BillItemRow({
  item,
  onCancelled,
}: {
  item: BillItem
  onCancelled: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isCancelled = item.status === 'CANCELLED'
  const canCancel = CANCELLABLE_STATUSES.has(item.status)
  const statusConfig = ITEM_STATUS_DISPLAY[item.status] ?? ITEM_STATUS_DISPLAY.PENDING

  // 3-second auto-reset for cancel confirmation
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

  const handleCancelTap = useCallback(async () => {
    if (!confirmingCancel) {
      setConfirmingCancel(true)
      return
    }
    // Second tap — execute cancel
    setLoading(true)
    setConfirmingCancel(false)
    try {
      const res = await fetch(
        `/api/staff/orders/${item.orderId}/items/${item.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel' }),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error(`[BillView] Cancel failed (${res.status}):`, err.error ?? 'Unknown error')
      } else {
        onCancelled()
      }
    } catch (err) {
      console.error('[BillView] Cancel network error:', err)
    } finally {
      setLoading(false)
    }
  }, [confirmingCancel, item.orderId, item.id, onCancelled])

  return (
    <div
      className={`flex items-center gap-3 py-3 border-b border-amber-100/60 last:border-b-0 transition-opacity duration-200 ${
        isCancelled ? 'opacity-50' : ''
      }`}
    >
      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold text-base ${
              isCancelled ? 'line-through text-amber-600/50' : 'text-amber-900'
            }`}
          >
            {item.name}
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
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
          >
            {statusConfig.label}
          </span>
          <span
            className={`text-xs font-variant-numeric: tabular-nums ${
              isCancelled ? 'text-amber-400 line-through' : 'text-amber-500'
            }`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatVND(item.price * item.quantity)}
          </span>
        </div>
      </div>

      {/* Cancel button — two-tap confirmation */}
      {canCancel && (
        <button
          onClick={handleCancelTap}
          disabled={loading}
          className={`
            min-h-[44px] px-4 py-2 rounded-xl font-semibold text-sm
            transition-all duration-150 active:scale-[0.96]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              confirmingCancel
                ? 'bg-red-600 text-white shadow-md shadow-red-900/20 min-w-[120px]'
                : 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-100'
            }
          `}
          style={{ transitionProperty: 'background-color, color, transform, box-shadow' }}
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : confirmingCancel ? (
            'Xác nhận huỷ?'
          ) : (
            'Huỷ'
          )}
        </button>
      )}
    </div>
  )
}

// ─── BillView ───────────────────────────────────────────────────────

export default function BillView({
  tableId,
  onBack,
}: {
  tableId: number
  onBack: () => void
}) {
  const [bill, setBill] = useState<BillData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [confirmingPay, setConfirmingPay] = useState(false)
  const payTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Fetch bill ─────────────────────────────────────────────
  const fetchBill = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/tables/${tableId}/bill`)
      if (!res.ok) {
        if (res.status === 404) {
          // No unpaid orders — navigate back
          onBack()
          return
        }
        throw new Error(`Lỗi tải hoá đơn (${res.status})`)
      }
      const data = await res.json()
      setBill(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }, [tableId, onBack])

  useEffect(() => {
    fetchBill()

    // SSE: refetch bill when items change or orders are paid on this table
    const es = new EventSource('/api/staff/orders/stream?station=all')

    es.addEventListener('item-status-change', () => {
      // An item status changed (e.g. cancel from another device) — refetch bill
      fetchBill()
    })

    es.addEventListener('order-paid', (event) => {
      try {
        const { tableId: paidTableId } = JSON.parse(event.data) as { tableId: number }
        if (paidTableId === tableId) {
          console.log('[BillView] SSE order-paid for this table → navigating back')
          onBack()
        }
      } catch {
        // Ignore parse errors
      }
    })

    es.addEventListener('new-order', () => {
      // New order on any table — refetch in case it's this table
      fetchBill()
    })

    return () => {
      es.close()
    }
  }, [fetchBill, tableId, onBack])

  // ─── 3-second auto-reset for pay confirmation ───────────────
  useEffect(() => {
    if (confirmingPay) {
      payTimerRef.current = setTimeout(() => {
        setConfirmingPay(false)
      }, 3000)
    }
    return () => {
      if (payTimerRef.current) {
        clearTimeout(payTimerRef.current)
        payTimerRef.current = null
      }
    }
  }, [confirmingPay])

  // ─── Pay handler — two-tap confirmation ─────────────────────
  const handlePayTap = useCallback(async () => {
    if (!confirmingPay) {
      setConfirmingPay(true)
      return
    }
    // Second tap — execute payment
    setPaying(true)
    setConfirmingPay(false)
    try {
      const res = await fetch(`/api/staff/tables/${tableId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error(`[BillView] Pay failed (${res.status}):`, err.error ?? 'Unknown error')
        setPaying(false)
        return
      }
      console.log(`[BillView] Payment successful for table ${tableId}`)
      // Navigate back — table will disappear from checkout list
      onBack()
    } catch (err) {
      console.error('[BillView] Pay network error:', err)
      setPaying(false)
    }
  }, [confirmingPay, tableId, onBack])

  // ─── Item cancelled → refetch bill ──────────────────────────
  const handleItemCancelled = useCallback(() => {
    fetchBill()
  }, [fetchBill])

  // ─── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="inline-block w-8 h-8 border-3 border-amber-300 border-t-amber-700 rounded-full animate-spin" />
      </div>
    )
  }

  // ─── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <span className="text-4xl mb-3 opacity-50">⚠️</span>
        <p className="text-amber-800 font-medium mb-4">{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); fetchBill() }}
          className="min-h-[44px] px-6 py-2 rounded-xl bg-amber-700 text-amber-50 font-semibold text-sm hover:bg-amber-800 transition-colors active:scale-[0.96]"
          style={{ transitionProperty: 'background-color, transform' }}
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (!bill) return null

  // ─── Separate active vs cancelled items ─────────────────────
  const activeItems = bill.items.filter((i) => i.status !== 'CANCELLED')
  const cancelledItems = bill.items.filter((i) => i.status === 'CANCELLED')

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-200">
      {/* ─── Back button + table header ──────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/60 border border-amber-200/40 text-amber-700 hover:bg-amber-100 transition-colors active:scale-[0.96]"
          style={{ transitionProperty: 'background-color, transform' }}
          aria-label="Quay lại danh sách bàn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-amber-900 tracking-tight">
            {bill.table.name}
          </h2>
          <p className="text-sm text-amber-600">
            {bill.orders.length} đơn · {bill.items.length} món
          </p>
        </div>
      </div>

      {/* ─── Bill card ───────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/60 shadow-lg shadow-amber-900/5 overflow-hidden">
        {/* Active items */}
        <div className="px-5 py-3">
          {activeItems.length > 0 ? (
            activeItems.map((item) => (
              <BillItemRow
                key={item.id}
                item={item}
                onCancelled={handleItemCancelled}
              />
            ))
          ) : (
            <p className="text-amber-500 text-center py-6">Không có món nào</p>
          )}
        </div>

        {/* Cancelled items (collapsible) */}
        {cancelledItems.length > 0 && (
          <div className="px-5 pb-3 border-t border-amber-100/60">
            <p className="text-xs font-semibold text-amber-500/60 uppercase tracking-wider mt-3 mb-1">
              Đã huỷ
            </p>
            {cancelledItems.map((item) => (
              <BillItemRow
                key={item.id}
                item={item}
                onCancelled={handleItemCancelled}
              />
            ))}
          </div>
        )}

        {/* ─── Total + Pay button ────────────────────────────── */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200/40">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-amber-800">
              Tổng cộng
            </span>
            <span
              className="text-2xl font-bold text-amber-900"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatVND(bill.total)}
            </span>
          </div>

          <button
            data-testid="pay-button"
            onClick={handlePayTap}
            disabled={paying || activeItems.length === 0}
            className={`
              w-full min-h-[52px] py-3 rounded-2xl font-bold text-base
              transition-colors duration-200 active:scale-[0.96]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                confirmingPay
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'bg-amber-700 text-amber-50 hover:bg-amber-800 shadow-md shadow-amber-900/20'
              }
            `}
            style={{ transitionProperty: 'background-color, color, transform, box-shadow' }}
          >
            {paying ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Đang xử lý…
              </span>
            ) : confirmingPay ? (
              'Xác nhận thanh toán? ✓'
            ) : (
              `Đã thanh toán · ${formatVND(bill.total)}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
