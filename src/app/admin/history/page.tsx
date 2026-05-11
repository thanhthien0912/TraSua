'use client'

import { useState, useEffect } from 'react'
import { formatVND } from '@/lib/format'

interface OrderRecord {
  id: number
  total: number
  paidAt: string
  items: string[]
}

interface TableHistory {
  id: number
  name: string
  totalRevenue: number
  orderCount: number
  orders: OrderRecord[]
}

export default function AdminHistoryPage() {
  const [data, setData] = useState<{ tables: TableHistory[], totalRevenue: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<TableHistory | null>(null)

  useEffect(() => {
    fetch('/api/admin/history')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center font-black uppercase text-foreground/20 text-xs tracking-widest">Đang tính toán...</div>

  // ─── Chi tiết một bàn ───────────────────────────────────────
  if (selectedTable) {
    return (
      <div className="pb-24 animate-in fade-in duration-200">
        <header className="sticky top-0 z-20 bg-white border-b border-border p-4 flex items-center gap-3">
          <button onClick={() => setSelectedTable(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary active:scale-95">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div>
            <h1 className="font-black text-foreground uppercase tracking-tight text-lg">{selectedTable.name}</h1>
            <p className="text-[10px] font-black text-primary uppercase">Tổng thu: {formatVND(selectedTable.totalRevenue)}</p>
          </div>
        </header>

        <main className="p-4 flex flex-col gap-3">
          {selectedTable.orders.map(order => (
            <div key={order.id} className="bg-white border-2 border-border rounded-2xl p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-foreground/30 uppercase tracking-wider">{new Date(order.paidAt).toLocaleString('vi-VN')}</span>
                <span className="font-black text-primary tabular-nums">{formatVND(order.total)}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {order.items.map((item, i) => (
                  <span key={i} className="text-[10px] font-black bg-secondary px-2 py-1 rounded-lg text-foreground/50 uppercase">{item}</span>
                ))}
              </div>
            </div>
          ))}
          {selectedTable.orders.length === 0 && (
            <p className="text-center py-20 font-black text-foreground/20 uppercase text-xs">Bàn này chưa có doanh thu</p>
          )}
        </main>
      </div>
    )
  }

  // ─── Danh sách tất cả bàn ───────────────────────────────────
  return (
    <div className="pb-24 animate-in fade-in duration-200">
      <header className="sticky top-0 z-10 bg-white border-b border-border p-5 shadow-sm">
        <h1 className="text-xl font-black text-foreground uppercase tracking-tight text-center">Báo cáo doanh thu</h1>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {/* Doanh thu tổng */}
        <div className="bg-foreground rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Tổng cộng toàn quán</p>
            <p className="text-4xl font-black tabular-nums">{formatVND(data?.totalRevenue || 0)}</p>
          </div>
        </div>

        {/* Lưới các bàn */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data?.tables.map(table => (
            <button
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className="bg-white border-2 border-border rounded-2xl p-5 text-center active:scale-95 transition-all shadow-sm group hover:border-primary"
            >
              <p className="text-xl font-black text-foreground mb-1 group-hover:text-primary">{table.name}</p>
              <p className="text-[10px] font-black text-foreground/30 uppercase mb-3 tracking-tighter">{table.orderCount} đơn đã trả</p>
              <div className="bg-secondary/50 rounded-xl py-2 px-1">
                <p className="text-sm font-black text-primary tabular-nums">{formatVND(table.totalRevenue)}</p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
