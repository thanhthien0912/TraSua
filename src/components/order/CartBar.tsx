'use client'

import { useCart } from '@/components/order/CartProvider'
import { formatVND } from '@/lib/format'

type CartBarProps = {
  onOpen: () => void
}

export default function CartBar({ onOpen }: CartBarProps) {
  const { totalItems, totalAmount } = useCart()

  const isEmpty = totalItems === 0

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 px-5 pb-5"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
        pointerEvents: isEmpty ? 'none' : 'auto',
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Xem giỏ hàng, ${totalItems} món, tổng ${formatVND(totalAmount)}`}
        className="flex w-full items-center justify-between rounded-2xl px-6 text-white shadow-2xl transition-all duration-200 ease-out hover:shadow-orange-500/50 active:scale-[0.97]"
        style={{
          minHeight: 60,
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          boxShadow:
            '0 8px 24px rgba(249, 115, 22, 0.4), 0 2px 8px rgba(234, 88, 12, 0.3)',
          transform: isEmpty ? 'translateY(150%)' : 'translateY(0)',
          opacity: isEmpty ? 0 : 1,
          transitionProperty: 'transform, opacity, box-shadow',
          willChange: 'transform',
        }}
        tabIndex={isEmpty ? -1 : 0}
      >
        {/* Left: badge + label */}
        <span className="flex items-center gap-3">
          <span
            className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-white/25 px-2 text-base font-bold backdrop-blur-sm"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {totalItems}
          </span>
          <span className="text-lg font-bold">Xem giỏ hàng</span>
        </span>

        {/* Right: total */}
        <span
          className="text-lg font-bold"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatVND(totalAmount)}
        </span>
      </button>
    </div>
  )
}
