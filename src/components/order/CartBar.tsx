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
        className="flex w-full items-center justify-between rounded-2xl px-6 text-white shadow-xl active:scale-95 transition-all"
        style={{
          minHeight: 64,
          backgroundColor: '#e67e22', // Màu Cam rực rỡ để không lẫn vào đâu được
          border: '2px solid #ffffff40',
          transform: isEmpty ? 'translateY(150%)' : 'translateY(0)',
          opacity: isEmpty ? 0 : 1,
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
