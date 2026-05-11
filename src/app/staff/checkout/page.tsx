'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { formatVND } from '@/lib/format'
import BillView from '@/components/staff/BillView'
import { SkeletonCard } from '@/components/ui/Skeleton'

interface TableWithBill {
  id: number
  number: number
  name: string
  orderCount: number
  total: number
}

interface TableWithBill {
  id: number
  number: number
  name: string
  orderCount: number
  total: number
  isPaid?: boolean
}

export default function CheckoutPage() {
  const [tables, setTables] = useState<TableWithBill[]>([])
  const tablesRef = useRef<TableWithBill[]>([])
  const [recentPaidTables, setRecentPaidPaidTables] = useState<TableWithBill[]>([])

  // Đồng bộ ref với state
  useEffect(() => {
    tablesRef.current = tables
  }, [tables])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchTables = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/staff/checkout')
      if (!res.ok) return
      const data = await res.json()
      setTables(data.tables)
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTables()
    pollRef.current = setInterval(fetchTables, 10_000)
    const es = new EventSource('/api/staff/orders/stream?station=all')
    
    es.addEventListener('order-paid', (event) => {
      try {
        const orderData = JSON.parse(event.data)
        setRecentPaidPaidTables(prev => {
          const exists = prev.find(t => t.id === orderData.tableId)
          if (exists) return prev
          // Dùng ref thay vì dependency trực tiếp để tránh loop
          const tableInfo = tablesRef.current.find(t => t.id === orderData.tableId)
          if (!tableInfo) return prev
          return [{ ...tableInfo, isPaid: true }, ...prev].slice(0, 5)
        })
      } catch {}
      fetchTables()
    })
    
    es.addEventListener('item-status-change', () => fetchTables())
    es.addEventListener('new-order', () => fetchTables())
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      es.close()
    }
  }, [fetchTables]) // Đã xoá 'tables' khỏi đây

  const handleBack = useCallback(() => {
    setSelectedTableId(null)
    setLoading(true)
    fetchTables()
  }, [fetchTables])

  // ── Bill detail view ────────────────────────────────────────
  if (selectedTableId !== null) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 bg-white border-b border-border shadow-sm">
          <div className="px-4 py-4 flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <h1 className="text-xl font-black text-foreground">Chi tiết hoá đơn</h1>
            </div>
          </div>
        </header>
        <main className="px-4 py-5 pb-24 max-w-2xl mx-auto">
          <BillView tableId={selectedTableId} onBack={handleBack} />
        </main>
      </div>
    )
  }

  // ── Table list view ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-white border-b border-border shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <h1 className="text-xl font-black text-foreground">Tính tiền</h1>
              <p className="text-xs font-bold text-foreground/40 mt-0.5">
                {loading ? 'Đang tải…' : `${tables.length} bàn chưa thanh toán`}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setLoading(true); fetchTables() }}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border active:scale-95 text-foreground/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          </button>
        </div>
      </header>

      <main className="px-4 py-5 pb-24 max-w-7xl mx-auto">
        {/* ĐANG HOẠT ĐỘNG */}
        {tables.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                className="bg-white rounded-2xl border-2 border-border text-left p-5 active:scale-95 hover:border-primary transition-all shadow-sm group"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-2xl font-black text-foreground">{table.name}</span>
                  <span className="text-[10px] font-black uppercase bg-secondary text-foreground/50 px-2 py-1 rounded-lg">
                    {table.orderCount} đơn
                  </span>
                </div>
                <p className="text-xs font-black uppercase text-foreground/30 mb-1">Tổng tạm tính</p>
                <p className="text-2xl font-black text-primary tabular-nums">{formatVND(table.total)}</p>
                <p className="text-xs font-black text-foreground/30 mt-3 group-hover:text-primary transition-colors">
                  Xem hoá đơn →
                </p>
              </button>
            ))}
          </div>
        )}

        {/* VỪA THANH TOÁN (LỊCH SỬ NHANH) */}
        {recentPaidTables.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Vừa thanh toán</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50 grayscale">
              {recentPaidTables.map((table) => (
                <div
                  key={table.id}
                  className="bg-white rounded-2xl border border-border text-left p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xl font-black text-foreground">{table.name}</span>
                    <span className="text-[10px] font-black uppercase bg-green-100 text-green-700 px-2 py-1 rounded-lg">PAID</span>
                  </div>
                  <p className="text-xl font-black text-foreground/40 tabular-nums">{formatVND(table.total)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && tables.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white border border-border p-5 space-y-3">
                <SkeletonCard className="h-6 w-28 rounded-lg" />
                <SkeletonCard className="h-8 w-36 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {!loading && tables.length === 0 && recentPaidTables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4 opacity-20">🎉</div>
            <h2 className="text-lg font-black text-foreground/40 mb-2">Tất cả bàn đã thanh toán!</h2>
          </div>
        )}
      </main>
    </div>
  )
}
