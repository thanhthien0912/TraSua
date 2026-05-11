'use client'

import { useEffect, useState } from 'react'
import { formatVND } from '@/lib/format'

type OrderSummaryItem = {
  name: string
  quantity: number
  price: number
}

type OrderSummary = {
  id: number
  totalAmount: number
  items: OrderSummaryItem[]
}

type OrderConfirmationProps = {
  order: OrderSummary
  tableNumber: number
}

export default function OrderConfirmation({
  order,
  tableNumber,
}: OrderConfirmationProps) {
  const [visible, setVisible] = useState(false)

  // Trigger staggered entrance after mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="flex min-h-dvh flex-col items-center px-5 pb-8 pt-16">
      {/* ── Checkmark circle ─────────────────────────────────── */}
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          background: 'var(--primary)',
          boxShadow: '0 8px 32px rgba(230, 126, 34, 0.2)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
          transition: 'all 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6 6L27 12" />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl font-black text-foreground uppercase tracking-tight">Đặt món thành công!</h1>
      <p className="mt-1 text-sm font-bold text-foreground/40">Bàn {tableNumber} · Đơn #{order.id}</p>

      <div className="mt-8 w-full max-w-sm rounded-3xl bg-white p-6 border-2 border-border shadow-sm">
        <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-foreground/30 border-b border-border pb-3">Chi tiết đơn hàng</h2>
        <div className="flex flex-col gap-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-3">
              <p className="font-black text-foreground">
                {item.name}
                <span className="ml-2 text-sm text-primary">×{item.quantity}</span>
              </p>
              <span className="shrink-0 font-black text-foreground/50 tabular-nums">
                {formatVND(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t-2 border-dashed border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase text-foreground/40">Tổng cộng</span>
            <span className="text-2xl font-black text-foreground tabular-nums">{formatVND(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* ── Footer Info ────────────────────────────────────────── */}
      <p 
        className="mt-12 text-center text-xs font-bold uppercase tracking-widest text-amber-900/30"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 1s ease 0.5s'
        }}
      >
        Vui lòng đợi trong giây lát...
      </p>
    </div>
  )
}
