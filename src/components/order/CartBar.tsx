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
      className="fixed inset-x-0 bottom-0 z-30 px-4"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        pointerEvents: isEmpty ? 'none' : 'auto',
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Xem giỏ hàng, ${totalItems} món, tổng ${formatVND(totalAmount)}`}
        className="flex w-full items-center justify-between rounded-2xl px-5 text-amber-50 shadow-lg transition-transform transition-opacity duration-200 ease-out active:scale-[0.97]"
        style={{
          minHeight: 52,
          background: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
          boxShadow:
            '0 4px 16px rgba(120, 53, 15, 0.25), 0 1px 4px rgba(120, 53, 15, 0.15)',
          transform: isEmpty ? 'translateY(120%)' : 'translateY(0)',
          opacity: isEmpty ? 0 : 1,
          transitionProperty: 'transform, opacity',
          willChange: 'transform',
        }}
        tabIndex={isEmpty ? -1 : 0}
      >
        {/* Left: badge + label */}
        <span className="flex items-center gap-3">
          <span
            className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-amber-50/20 px-1.5 text-sm font-bold"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {totalItems}
          </span>
          <span className="text-[15px] font-semibold">Xem giỏ hàng</span>
        </span>

        {/* Right: total */}
        <span
          className="text-[15px] font-bold"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatVND(totalAmount)}
        </span>
      </button>
    </div>
  )
}
