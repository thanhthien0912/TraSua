'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { formatVND } from '@/lib/format'

// ─── Types ──────────────────────────────────────────────────────────

interface MenuItem {
  id: number
  name: string
  price: number
  category: 'DRINK' | 'FOOD'
  available: boolean
  sortOrder: number
}

type Tab = 'DRINK' | 'FOOD'

const TABS: { key: Tab; label: string }[] = [
  { key: 'DRINK', label: 'Đồ uống' },
  { key: 'FOOD', label: 'Đồ ăn' },
]

// ─── Props ──────────────────────────────────────────────────────────

interface MenuPickerModalProps {
  orderId: number
  tableId: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// ─── MenuPickerModal ────────────────────────────────────────────────

export default function MenuPickerModal({
  orderId,
  tableId,
  isOpen,
  onClose,
  onSuccess,
}: MenuPickerModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('DRINK')
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [menuError, setMenuError] = useState<string | null>(null)

  // Selection state — single item at a time
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Visibility + animation state
  const [visible, setVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // ─── Fetch menu when opened ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    setLoadingMenu(true)
    setMenuError(null)
    setSelectedItem(null)
    setQuantity(1)
    setNotes('')
    setSubmitError(null)
    setActiveTab('DRINK')

    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true))

    fetch('/api/staff/menu')
      .then(async (res) => {
        if (!res.ok) throw new Error(`Lỗi tải thực đơn (${res.status})`)
        const data = await res.json()
        setMenuItems(data.items ?? [])
        console.log(`[MenuPickerModal] Loaded ${data.items?.length ?? 0} menu items`)
      })
      .catch((err) => {
        console.error('[MenuPickerModal] Menu fetch error:', err)
        setMenuError(err instanceof Error ? err.message : 'Lỗi không xác định')
      })
      .finally(() => setLoadingMenu(false))
  }, [isOpen])

  // ─── Close with exit animation ──────────────────────────────
  const handleClose = useCallback(() => {
    setVisible(false)
    // Wait for exit animation before actually closing
    setTimeout(() => {
      onClose()
    }, 200)
  }, [onClose])

  // ─── Click outside → dismiss ────────────────────────────────
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        handleClose()
      }
    },
    [handleClose]
  )

  // ─── Select an item ─────────────────────────────────────────
  const handleSelectItem = useCallback((item: MenuItem) => {
    if (!item.available) return
    setSelectedItem(item)
    setQuantity(1)
    setNotes('')
    setSubmitError(null)
  }, [])

  // ─── Quantity adjusters ─────────────────────────────────────
  const handleDecrement = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1))
  }, [])

  const handleIncrement = useCallback(() => {
    setQuantity((q) => q + 1)
  }, [])

  // ─── Submit ─────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!selectedItem) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(`/api/staff/orders/${orderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              menuItemId: selectedItem.id,
              quantity,
              ...(notes.trim() ? { notes: notes.trim() } : {}),
            },
          ],
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          setSubmitError(data.error ?? 'Đơn hàng đã thanh toán hoặc món đã hết hàng.')
        } else {
          setSubmitError(data.error ?? `Lỗi thêm món (${res.status})`)
        }
        return
      }

      console.log(
        `[MenuPickerModal] Added ${quantity}× ${selectedItem.name} to order #${orderId}`
      )
      onSuccess()
      handleClose()
    } catch (err) {
      console.error('[MenuPickerModal] Submit error:', err)
      setSubmitError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }, [selectedItem, quantity, notes, orderId, onSuccess, handleClose])

  // ─── Don't render if not open ───────────────────────────────
  if (!isOpen) return null

  const filtered = menuItems
    .filter((item) => item.category === activeTab)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    /* ─── Overlay (dimmed backdrop) ─────────────────────────── */
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`
        fixed inset-0 z-50 flex items-end justify-center
        transition-colors duration-200
        ${visible ? 'bg-black/40' : 'bg-black/0'}
      `}
      style={{ transitionProperty: 'background-color' }}
    >
      {/* ─── Modal content (slide up from bottom) ──────────── */}
      <div
        className={`
          w-full max-w-lg bg-amber-50 rounded-t-3xl
          overflow-hidden flex flex-col
          transition-transform duration-250 ease-out
          ${visible ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{
          maxHeight: '85vh',
          transitionProperty: 'transform',
          transitionTimingFunction: visible
            ? 'cubic-bezier(0.16, 1, 0.3, 1)'   /* ease-out for enter */
            : 'cubic-bezier(0.4, 0, 1, 1)',      /* ease-in for exit */
          transitionDuration: visible ? '300ms' : '200ms',
        }}
      >
        {/* ─── Drag handle + Header ────────────────────────── */}
        <div className="sticky top-0 z-10 bg-amber-50">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-amber-300/60" />
          </div>
          <div className="flex items-center justify-between px-5 pb-3">
            <h2 className="text-lg font-bold text-amber-900" style={{ textWrap: 'balance' as never }}>
              Thêm món
            </h2>
            <button
              onClick={handleClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-amber-600 hover:text-amber-900 hover:bg-amber-100 transition-colors active:scale-[0.96]"
              style={{ transitionProperty: 'background-color, color, transform' }}
              aria-label="Đóng"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ─── Tab Bar ─────────────────────────────────────── */}
          <div className="px-5 pb-3">
            <nav
              role="tablist"
              aria-label="Danh mục thực đơn"
              className="inline-flex w-full rounded-xl bg-amber-100/70 p-1"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`modal-panel-${tab.key}`}
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                      flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold
                      transition-colors duration-150 ease-out
                      ${
                        isActive
                          ? 'bg-amber-900 text-amber-50 shadow-sm shadow-amber-900/20'
                          : 'text-amber-700 hover:text-amber-900'
                      }
                    `}
                    style={{ minHeight: 44, transitionProperty: 'background-color, color, box-shadow' }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
          <div className="h-px bg-amber-200/50" />
        </div>

        {/* ─── Scrollable item list ─────────────────────────── */}
        <div
          id={`modal-panel-${activeTab}`}
          role="tabpanel"
          aria-label={TABS.find((t) => t.key === activeTab)?.label}
          className="flex-1 overflow-y-auto px-5 py-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loadingMenu ? (
            <div className="flex items-center justify-center py-16">
              <span className="inline-block w-7 h-7 border-3 border-amber-300 border-t-amber-700 rounded-full animate-spin" />
            </div>
          ) : menuError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-3xl mb-2 opacity-50">⚠️</span>
              <p className="text-amber-700 text-sm">{menuError}</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-amber-700/60" style={{ textWrap: 'pretty' as never }}>
              Chưa có món nào trong danh mục này.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((item) => {
                const isSelected = selectedItem?.id === item.id
                const unavailable = !item.available
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={unavailable}
                    onClick={() => handleSelectItem(item)}
                    className={`
                      w-full text-left rounded-2xl p-4
                      transition-all duration-150 ease-out
                      disabled:cursor-not-allowed
                      ${
                        unavailable
                          ? 'opacity-50 bg-amber-100/40'
                          : isSelected
                          ? 'bg-amber-900/10 ring-2 ring-amber-700/40 active:scale-[0.98]'
                          : 'bg-white active:scale-[0.96]'
                      }
                    `}
                    style={{
                      transitionProperty: 'transform, background-color, box-shadow, opacity',
                      boxShadow: unavailable
                        ? 'none'
                        : isSelected
                        ? '0 2px 8px rgba(120, 53, 15, 0.08)'
                        : '0 1px 3px rgba(120, 53, 15, 0.06), 0 1px 2px rgba(120, 53, 15, 0.04)',
                    }}
                    aria-disabled={unavailable || undefined}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-[15px] font-semibold leading-snug ${
                            unavailable ? 'text-amber-800/50' : 'text-amber-950'
                          }`}
                        >
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-sm font-semibold ${
                              unavailable ? 'text-amber-700/40' : 'text-amber-800'
                            }`}
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {formatVND(item.price)}
                          </span>
                        </div>
                      </div>
                      {unavailable ? (
                        <span className="inline-flex items-center rounded-lg bg-amber-200/60 px-2.5 py-1 text-xs font-medium text-amber-600">
                          Hết hàng
                        </span>
                      ) : isSelected ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-800 text-amber-50">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ─── Selection detail + submit ────────────────────── */}
        {selectedItem && (
          <div className="border-t border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
            {/* Selected item name */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-amber-900 truncate flex-1 mr-3">
                {selectedItem.name}
              </span>
              <span
                className="text-sm font-bold text-amber-800 flex-shrink-0"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatVND(selectedItem.price * quantity)}
              </span>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-amber-700">Số lượng</span>
              <div className="flex items-center gap-1 bg-white rounded-xl border border-amber-200/60 p-0.5">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-amber-700 hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-[0.96]"
                  style={{ transitionProperty: 'background-color, transform' }}
                  aria-label="Giảm số lượng"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </button>
                <span
                  className="min-w-[40px] text-center text-lg font-bold text-amber-900"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-amber-700 hover:bg-amber-100 transition-colors active:scale-[0.96]"
                  style={{ transitionProperty: 'background-color, transform' }}
                  aria-label="Tăng số lượng"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Notes input */}
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú (tuỳ chọn)"
              className="w-full rounded-xl border border-amber-200/60 bg-white px-4 py-3 text-sm text-amber-900 placeholder:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-600/30 mb-3"
              style={{ minHeight: 44 }}
            />

            {/* Error message */}
            {submitError && (
              <p className="text-sm text-red-600 mb-3 bg-red-50 rounded-lg px-3 py-2">
                {submitError}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 min-h-[48px] rounded-2xl bg-white border border-amber-200/60 text-amber-700 font-semibold text-sm hover:bg-amber-100 transition-colors active:scale-[0.96] disabled:opacity-50"
                style={{ transitionProperty: 'background-color, transform' }}
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-[2] min-h-[48px] rounded-2xl bg-amber-700 text-amber-50 font-bold text-sm hover:bg-amber-800 shadow-md shadow-amber-900/20 transition-colors active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ transitionProperty: 'background-color, transform, box-shadow' }}
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Đang thêm…
                  </span>
                ) : (
                  `Thêm · ${formatVND(selectedItem.price * quantity)}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
