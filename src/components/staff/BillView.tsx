'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { formatVND } from '@/lib/format'
import type { ItemStatus } from '@/lib/order-status'
import MenuPickerModal from './MenuPickerModal'

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
  PENDING:   { label: 'Chờ',         bg: 'bg-orange-100', text: 'text-orange-700' },
  PREPARING: { label: 'Đang pha',    bg: 'bg-blue-100',   text: 'text-blue-700'   },
  READY:     { label: 'Xong',        bg: 'bg-green-100',  text: 'text-green-700'  },
  SERVED:    { label: 'Đã phục vụ', bg: 'bg-slate-100',  text: 'text-slate-500'  },
  CANCELLED: { label: 'Huỷ',        bg: 'bg-red-100',    text: 'text-red-600'    },
}

const CANCELLABLE_STATUSES: Set<string> = new Set([
  'PENDING',
  'PREPARING',
  'READY',
])

// ─── BillItemRow ────────────────────────────────────────────────────

function BillItemRow({
  item,
  onChanged,
}: {
  item: BillItem
  onChanged: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isCancelled = item.status === 'CANCELLED'
  const canCancel = CANCELLABLE_STATUSES.has(item.status)
  const statusConfig = ITEM_STATUS_DISPLAY[item.status] ?? ITEM_STATUS_DISPLAY.PENDING

  useEffect(() => {
    if (confirmingCancel || confirmingDelete) {
      timerRef.current = setTimeout(() => {
        setConfirmingCancel(false)
        setConfirmingDelete(false)
      }, 3000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [confirmingCancel, confirmingDelete])

  const handleCancelTap = useCallback(async () => {
    if (!confirmingCancel) { setConfirmingCancel(true); return }
    setLoading(true)
    try {
      await fetch(`/api/staff/orders/${item.orderId}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      onChanged()
    } finally { setLoading(false); setConfirmingCancel(false) }
  }, [confirmingCancel, item.orderId, item.id, onChanged])

  const handleDeleteTap = useCallback(async () => {
    if (!confirmingDelete) { setConfirmingDelete(true); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/orders/${item.orderId}/items/${item.id}`, {
        method: 'DELETE'
      })
      if (res.ok) onChanged()
    } finally { setLoading(false); setConfirmingDelete(false) }
  }, [confirmingDelete, item.orderId, item.id, onChanged])

  return (
    <div className={`flex items-center gap-3 py-3 border-b border-border last:border-b-0 ${isCancelled ? 'opacity-40' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-black text-base ${isCancelled ? 'line-through text-foreground/30' : 'text-foreground'}`}>
            {item.name}
          </span>
          <span className="text-primary font-black text-sm flex-shrink-0">×{item.quantity}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black ${statusConfig.bg} ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
          <span className={`text-xs font-black tabular-nums ${isCancelled ? 'line-through text-foreground/20' : 'text-foreground/50'}`}>
            {formatVND(item.price * item.quantity)}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        {/* Delete Button */}
        <button
          onClick={handleDeleteTap}
          disabled={loading}
          className={`min-h-[44px] px-3 py-2 rounded-xl font-black text-xs uppercase active:scale-95
            ${confirmingDelete ? 'bg-red-700 text-white' : 'bg-white text-red-500 border border-red-100'}`}
        >
          {confirmingDelete ? 'Xoá hẳn?' : 'Xoá'}
        </button>

        {/* Cancel Button */}
        {canCancel && (
          <button
            onClick={handleCancelTap}
            disabled={loading}
            className={`min-h-[44px] px-3 py-2 rounded-xl font-black text-xs uppercase active:scale-95
              ${confirmingCancel ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}
          >
            {confirmingCancel ? 'Huỷ món?' : 'Huỷ'}
          </button>
        )}
      </div>
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
  const [showMenuPicker, setShowMenuPicker] = useState(false)

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
        <span className="inline-block w-8 h-8 border-3 border-emerald-300 border-t-amber-700 rounded-full animate-spin" />
      </div>
    )
  }

  // ─── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <span className="text-4xl mb-3 opacity-50">⚠️</span>
        <p className="text-emerald-800 font-medium mb-4">{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); fetchBill() }}
          className="min-h-[44px] px-6 py-2 rounded-xl bg-emerald-700 text-emerald-50 font-semibold text-sm hover:bg-emerald-800 transition-colors active:scale-[0.96]"
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
    <div className="animate-in fade-in duration-200">
      {/* Back + table header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-border active:scale-95"
          aria-label="Quay lại"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-foreground">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-black text-foreground">{bill.table.name}</h2>
          <p className="text-xs font-bold text-foreground/40">{bill.orders.length} đơn · {bill.items.length} món</p>
        </div>
      </div>

      {/* Bill card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Active items */}
        <div className="px-5 py-2">
          {activeItems.length > 0
            ? activeItems.map((item) => <BillItemRow key={item.id} item={item} onChanged={handleItemCancelled} />)
            : <p className="text-foreground/30 font-black text-center py-6 text-sm">Không có món nào</p>}
        </div>

        {/* Cancelled items */}
        {cancelledItems.length > 0 && (
          <div className="px-5 pb-3 border-t border-border/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mt-3 mb-1">Đã huỷ</p>
            {cancelledItems.map((item) => <BillItemRow key={item.id} item={item} onChanged={handleItemCancelled} />)}
          </div>
        )}

        {/* Add item */}
        <div className="px-5 py-3 border-t border-border/50">
          <button
            onClick={() => setShowMenuPicker(true)}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-secondary border border-border text-foreground font-black text-sm uppercase active:scale-95"
          >
            + Thêm món
          </button>
        </div>

        {/* Total + Pay */}
        <div className="px-5 py-5 bg-secondary/30 border-t border-border/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-black uppercase text-foreground/50">Tổng cộng</span>
            <span className="text-2xl font-black text-foreground tabular-nums">{formatVND(bill.total)}</span>
          </div>
          <button
            data-testid="pay-button"
            onClick={handlePayTap}
            disabled={paying || activeItems.length === 0}
            className={`w-full min-h-[56px] rounded-2xl font-black text-base uppercase active:scale-95 disabled:opacity-30 transition-all
              ${confirmingPay ? 'bg-green-600 text-white shadow-lg' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}
          >
            {paying
              ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />Đang xử lý…</span>
              : confirmingPay ? 'Xác nhận thanh toán? ✓'
              : `Đã thanh toán · ${formatVND(bill.total)}`}
          </button>
        </div>
      </div>

      <MenuPickerModal
        orderId={bill.orders[bill.orders.length - 1].id}
        tableId={tableId}
        isOpen={showMenuPicker}
        onClose={() => setShowMenuPicker(false)}
        onSuccess={fetchBill}
      />
    </div>
  )
}
