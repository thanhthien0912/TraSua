'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useCart } from '@/components/order/CartProvider'
import type { CartItem } from '@/components/order/CartProvider'
import { formatVND } from '@/lib/format'

// ─── Radius constants (concentric: outer = inner + padding) ────────
const SHEET_PADDING = 8
const INNER_RADIUS = 16 // rounded-2xl ≈ 16px
const OUTER_RADIUS = INNER_RADIUS + SHEET_PADDING // 24px

type CartSheetProps = {
  isOpen: boolean
  onClose: () => void
}

export default function CartSheet({ isOpen, onClose }: CartSheetProps) {
  const { state, totalAmount, dispatch } = useCart()
  const items = state.items
  const sheetRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSubmit = useCallback(() => {
    // T03 will wire submission logic
    console.log('[CartSheet] Gửi đơn — placeholder, will be wired in T03')
  }, [])

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(69, 26, 3, 0.5)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transitionProperty: 'opacity',
          transitionDuration: '200ms',
          transitionTimingFunction: 'ease-out',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Sheet ─────────────────────────────────────────────── */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Giỏ hàng"
        className="fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col bg-amber-50"
        style={{
          borderTopLeftRadius: OUTER_RADIUS,
          borderTopRightRadius: OUTER_RADIUS,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transitionProperty: 'transform',
          transitionDuration: '300ms',
          transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
          boxShadow: isOpen
            ? '0 -8px 32px rgba(120, 53, 15, 0.15), 0 -2px 8px rgba(120, 53, 15, 0.08)'
            : 'none',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}
      >
        {/* ── Drag indicator ──────────────────────────────────── */}
        <div className="flex justify-center pb-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng giỏ hàng"
            className="h-1.5 w-10 rounded-full bg-amber-300/60 transition-colors duration-150 hover:bg-amber-400/60"
            style={{ minHeight: 6 }}
          />
        </div>

        {/* ── Title ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-amber-200/50 px-5 pb-3">
          <h2 className="text-lg font-bold text-amber-950">Giỏ hàng</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng giỏ hàng"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-amber-700 transition-colors duration-150 hover:bg-amber-100"
            style={{ minHeight: 48, minWidth: 48 }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Item list (scrollable) ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-amber-700/60">
              Giỏ hàng trống
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <CartItemRow
                  key={item.menuItemId}
                  item={item}
                  onUpdateQuantity={(qty) =>
                    dispatch({
                      type: 'UPDATE_QUANTITY',
                      payload: { menuItemId: item.menuItemId, quantity: qty },
                    })
                  }
                  onUpdateNotes={(notes) =>
                    dispatch({
                      type: 'UPDATE_NOTES',
                      payload: { menuItemId: item.menuItemId, notes },
                    })
                  }
                  onRemove={() =>
                    dispatch({
                      type: 'REMOVE_ITEM',
                      payload: { menuItemId: item.menuItemId },
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer: total + submit ──────────────────────────── */}
        {items.length > 0 && (
          <div
            className="border-t border-amber-200/50 px-5 pt-4 pb-2"
            style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
          >
            {/* Grand total */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[15px] font-semibold text-amber-800">
                Tổng cộng
              </span>
              <span
                className="text-lg font-bold text-amber-950"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatVND(totalAmount)}
              </span>
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full rounded-2xl py-3.5 text-[15px] font-bold text-amber-50 transition-transform duration-150 ease-out active:scale-[0.97]"
              style={{
                minHeight: 52,
                background:
                  'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
                boxShadow:
                  '0 4px 16px rgba(120, 53, 15, 0.25), 0 1px 4px rgba(120, 53, 15, 0.15)',
                borderRadius: INNER_RADIUS,
              }}
            >
              Gửi đơn
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Cart Item Row ──────────────────────────────────────────────────
function CartItemRow({
  item,
  onUpdateQuantity,
  onUpdateNotes,
  onRemove,
}: {
  item: CartItem
  onUpdateQuantity: (qty: number) => void
  onUpdateNotes: (notes: string) => void
  onRemove: () => void
}) {
  const subtotal = item.price * item.quantity

  return (
    <div
      className="rounded-2xl bg-white p-4"
      style={{
        boxShadow:
          '0 1px 3px rgba(120, 53, 15, 0.06), 0 4px 12px rgba(120, 53, 15, 0.04)',
        borderRadius: INNER_RADIUS,
      }}
    >
      {/* Top row: name + price + remove */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3
            className="text-[15px] font-semibold text-amber-950"
            style={{ textWrap: 'balance' }}
          >
            {item.name}
          </h3>
          <p
            className="mt-0.5 text-sm text-amber-700/65"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatVND(item.price)}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Xoá ${item.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-500"
          style={{ minHeight: 48, minWidth: 48 }}
        >
          <TrashIcon />
        </button>
      </div>

      {/* Quantity controls */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              item.quantity <= 1
                ? onRemove()
                : onUpdateQuantity(item.quantity - 1)
            }
            aria-label={`Giảm số lượng ${item.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 transition-colors duration-150 active:bg-amber-200"
            style={{ minHeight: 48, minWidth: 48 }}
          >
            <MinusIcon />
          </button>
          <span
            className="flex h-10 min-w-10 items-center justify-center px-2 text-[15px] font-bold text-amber-950"
            style={{ fontVariantNumeric: 'tabular-nums' }}
            aria-live="polite"
            aria-label={`Số lượng: ${item.quantity}`}
          >
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            aria-label={`Tăng số lượng ${item.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 transition-colors duration-150 active:bg-amber-200"
            style={{ minHeight: 48, minWidth: 48 }}
          >
            <PlusIcon />
          </button>
        </div>

        {/* Subtotal */}
        <span
          className="text-[15px] font-bold text-amber-950"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatVND(subtotal)}
        </span>
      </div>

      {/* Notes field */}
      <div className="mt-3">
        <input
          type="text"
          value={item.notes}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder="Ghi chú (ít đường, nhiều đá...)"
          aria-label={`Ghi chú cho ${item.name}`}
          className="w-full rounded-xl border border-amber-200/60 bg-amber-50/50 px-3 py-2.5 text-sm text-amber-900 placeholder:text-amber-400/60 transition-colors duration-150 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200/40"
          style={{ minHeight: 44 }}
        />
      </div>
    </div>
  )
}

// ─── Icons ──────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="4" y1="4" x2="14" y2="14" />
      <line x1="14" y1="4" x2="4" y2="14" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 4.5h11" />
      <path d="M5.5 4.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" />
      <path d="M12.5 4.5l-.6 8.4a1.5 1.5 0 0 1-1.5 1.4H5.6a1.5 1.5 0 0 1-1.5-1.4L3.5 4.5" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="4" y1="8" x2="12" y2="8" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="8" y1="4" x2="8" y2="12" />
      <line x1="4" y1="8" x2="12" y2="8" />
    </svg>
  )
}
