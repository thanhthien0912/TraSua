'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { formatVND } from '@/lib/format'
import BillView from '@/components/staff/BillView'

// ─── Types ──────────────────────────────────────────────────────────

interface TableWithBill {
  id: number
  number: number
  name: string
  orderCount: number
  total: number
}

// ─── CheckoutPage ───────────────────────────────────────────────────

export default function CheckoutPage() {
  const [tables, setTables] = useState<TableWithBill[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Fetch tables with unpaid orders ────────────────────────
  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/checkout')
      if (!res.ok) {
        console.error(`[Checkout] Fetch failed (${res.status})`)
        return
      }
      const data = await res.json()
      setTables(data.tables)
    } catch (err) {
      console.error('[Checkout] Network error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch + polling every 10s + SSE reactivity
  useEffect(() => {
    fetchTables()
    pollRef.current = setInterval(fetchTables, 10_000)

    // SSE: refetch table list when orders are paid or items change
    const es = new EventSource('/api/staff/orders/stream?station=all')

    es.addEventListener('order-paid', () => {
      console.log('[Checkout] SSE order-paid → refetching tables')
      fetchTables()
    })

    es.addEventListener('item-status-change', () => {
      // Item cancels from bill view affect totals
      fetchTables()
    })

    es.addEventListener('new-order', () => {
      // New orders add tables to the list
      fetchTables()
    })

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      es.close()
    }
  }, [fetchTables])

  // ─── Back from bill detail → refetch and deselect ───────────
  const handleBack = useCallback(() => {
    setSelectedTableId(null)
    setLoading(true)
    fetchTables()
  }, [fetchTables])

  // ─── Bill detail view ───────────────────────────────────────
  if (selectedTableId !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50/50">
        <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-amber-200/40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl" role="img" aria-label="Tính tiền">
                💰
              </span>
              <div>
                <h1 className="text-2xl font-bold text-amber-900 tracking-tight">
                  Tính tiền
                </h1>
                <p className="text-sm text-amber-600">Chi tiết hoá đơn</p>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <BillView tableId={selectedTableId} onBack={handleBack} />
        </main>
      </div>
    )
  }

  // ─── Table list view ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50/50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-amber-200/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl" role="img" aria-label="Tính tiền">
              💰
            </span>
            <div>
              <h1 className="text-2xl font-bold text-amber-900 tracking-tight"
                  style={{ textWrap: 'balance' } as React.CSSProperties}>
                Tính tiền
              </h1>
              <p className="text-sm text-amber-600">
                {loading
                  ? 'Đang tải…'
                  : tables.length > 0
                    ? `${tables.length} bàn chưa thanh toán`
                    : 'Tất cả bàn đã thanh toán'}
              </p>
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => { setLoading(true); fetchTables() }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/60 border border-amber-200/40 text-amber-700 hover:bg-amber-100 transition-colors active:scale-[0.96]"
            style={{ transitionProperty: 'background-color, transform' }}
            title="Tải lại"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          /* Loading skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-white/50 border border-amber-200/30 animate-pulse"
              />
            ))}
          </div>
        ) : tables.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4 opacity-40">🎉</div>
            <h2 className="text-xl font-semibold text-amber-800/60 mb-2"
                style={{ textWrap: 'balance' } as React.CSSProperties}>
              Tất cả bàn đã thanh toán!
            </h2>
            <p className="text-amber-600/50 text-sm max-w-xs">
              Không có bàn nào cần tính tiền. Danh sách sẽ tự cập nhật khi có đơn mới.
            </p>
          </div>
        ) : (
          /* Table cards grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/60
                           shadow-lg shadow-amber-900/5 overflow-hidden text-left
                           transition-all duration-200
                           hover:shadow-xl hover:shadow-amber-900/10 hover:border-amber-300/60
                           active:scale-[0.96]"
                style={{ transitionProperty: 'box-shadow, border-color, transform' }}
              >
                <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/40">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-amber-900">
                      {table.name}
                    </span>
                    <span className="text-xs font-medium text-amber-500 bg-amber-100 px-2.5 py-1 rounded-full">
                      {table.orderCount} đơn
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4 flex items-center justify-between">
                  <span className="text-sm text-amber-600">Tổng tạm tính</span>
                  <span
                    className="text-xl font-bold text-amber-900"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatVND(table.total)}
                  </span>
                </div>
                {/* Hover indicator arrow */}
                <div className="px-5 pb-4">
                  <div className="flex items-center gap-2 text-amber-500 group-hover:text-amber-700 transition-colors text-sm font-medium">
                    <span>Xem hoá đơn</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
