'use client'

import { useEffect, useState } from 'react'
import { formatVND } from '@/lib/format'

type OrderSummaryItem = {
  name: string
  quantity: number
  price: number
  notes: string | null
}

type OrderSummary = {
  id: number
  totalAmount: number
  items: OrderSummaryItem[]
}

type OrderConfirmationProps = {
  order: OrderSummary
  tableNumber: number
  onOrderMore: () => void
}

export default function OrderConfirmation({
  order,
  tableNumber,
  onOrderMore,
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
          background: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
          boxShadow:
            '0 8px 32px rgba(120, 53, 15, 0.2), 0 2px 8px rgba(120, 53, 15, 0.12)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
          transitionProperty: 'opacity, transform',
          transitionDuration: '500ms',
          transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
          transitionDelay: '0ms',
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          stroke="#fffbeb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 18l6 6L27 12" />
        </svg>
      </div>

      {/* ── Heading ──────────────────────────────────────────── */}
      <h1
        className="mt-6 text-2xl font-bold text-amber-950"
        style={{
          textWrap: 'balance',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transitionProperty: 'opacity, transform',
          transitionDuration: '400ms',
          transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
          transitionDelay: '100ms',
        }}
      >
        Đặt món thành công!
      </h1>
      <p
        className="mt-1 text-sm text-amber-700/70"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transitionProperty: 'opacity, transform',
          transitionDuration: '400ms',
          transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
          transitionDelay: '150ms',
        }}
      >
        Bàn {tableNumber} · Đơn #{order.id}
      </p>

      {/* ── Order summary card ───────────────────────────────── */}
      <div
        className="mt-8 w-full max-w-sm rounded-2xl bg-white p-5"
        style={{
          boxShadow:
            '0 1px 3px rgba(120, 53, 15, 0.06), 0 8px 24px rgba(120, 53, 15, 0.06)',
          borderRadius: 16,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transitionProperty: 'opacity, transform',
          transitionDuration: '400ms',
          transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
          transitionDelay: '250ms',
        }}
      >
        <h2 className="mb-3 text-[15px] font-semibold text-amber-800">
          Chi tiết đơn hàng
        </h2>
        <div className="flex flex-col gap-3">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-amber-950">
                  {item.name}
                  <span
                    className="ml-2 text-sm text-amber-600"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    ×{item.quantity}
                  </span>
                </p>
                {item.notes && (
                  <p className="mt-0.5 text-xs text-amber-600/70 italic">
                    {item.notes}
                  </p>
                )}
              </div>
              <span
                className="shrink-0 text-sm font-semibold text-amber-900"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatVND(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Divider + total */}
        <div className="mt-4 border-t border-amber-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-amber-800">
              Tổng cộng
            </span>
            <span
              className="text-lg font-bold text-amber-950"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatVND(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Order more button ────────────────────────────────── */}
      <button
        type="button"
        onClick={onOrderMore}
        className="mt-8 w-full max-w-sm rounded-2xl py-3.5 text-[15px] font-bold text-amber-50 transition-transform duration-150 ease-out active:scale-[0.97]"
        style={{
          minHeight: 52,
          background: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
          boxShadow:
            '0 4px 16px rgba(120, 53, 15, 0.25), 0 1px 4px rgba(120, 53, 15, 0.15)',
          borderRadius: 16,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
          transitionProperty: 'opacity, transform',
          transitionDuration: '400ms',
          transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
          transitionDelay: '350ms',
        }}
      >
        Gọi thêm món
      </button>
    </div>
  )
}
