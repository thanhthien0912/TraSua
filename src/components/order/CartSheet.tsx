'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCart } from '@/components/order/CartProvider'
import type { CartItem } from '@/components/order/CartProvider'
import { formatVND } from '@/lib/format'

const SHEET_PADDING = 8
const INNER_RADIUS = 16
const OUTER_RADIUS = INNER_RADIUS + SHEET_PADDING

type OrderSummaryItem = {
  name: string
  quantity: number
  price: number
}

export type OrderResult = {
  id: number
  totalAmount: number
  items: OrderSummaryItem[]
}

type CartSheetProps = {
  isOpen: boolean
  onClose: () => void
  tableId: number
  onOrderSuccess: (order: OrderResult) => void
}

export default function CartSheet({ isOpen, onClose, tableId, onOrderSuccess }: CartSheetProps) {
  const { state, totalAmount, dispatch } = useCart()
  const items = state.items
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unavailableIds, setUnavailableIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (error) setError(null)
    if (unavailableIds.size > 0) setUnavailableIds(new Set())
  }, [items])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || items.length === 0) return
    setIsSubmitting(true)
    setError(null)
    setUnavailableIds(new Set())
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      if (res.status === 409 && data.unavailableItems) {
        setUnavailableIds(new Set(data.unavailableItems as number[]))
        setError(data.error || 'Một số món đã hết hàng')
        return
      }
      if (!res.ok) { setError(data.error || 'Không gửi được đơn'); return }
      const orderData = data.order
      const orderResult: OrderResult = {
        id: orderData.id,
        totalAmount: orderData.totalAmount,
        items: orderData.items.map((oi: { menuItem: { name: string; price: number }; quantity: number }) => ({
          name: oi.menuItem.name,
          quantity: oi.quantity,
          price: oi.menuItem.price,
        })),
      }
      dispatch({ type: 'CLEAR_CART' })
      onClose()
      onOrderSuccess(orderResult)
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally { setIsSubmitting(false) }
  }, [isSubmitting, items, tableId, dispatch, onClose, onOrderSuccess])

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 transition-opacity" style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }} onClick={onClose} />
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col bg-background"
        style={{
          borderTopLeftRadius: OUTER_RADIUS,
          borderTopRightRadius: OUTER_RADIUS,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: isOpen ? '0 -8px 32px rgba(0,0,0,0.1)' : 'none',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}
      >
        <div className="flex justify-center pb-2 pt-3">
          <button onClick={onClose} className="h-1.5 w-10 rounded-full bg-border" style={{ minHeight: 6 }} />
        </div>
        <div className="flex items-center justify-between border-b border-border px-5 pb-3">
          <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Giỏ hàng</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl active:bg-secondary"><CloseIcon /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm font-bold text-foreground/30">Giỏ hàng trống</p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <CartItemRow
                  key={item.menuItemId}
                  item={item}
                  isUnavailable={unavailableIds.has(item.menuItemId)}
                  onUpdateQuantity={(qty) => dispatch({ type: 'UPDATE_QUANTITY', payload: { menuItemId: item.menuItemId, quantity: qty } })}
                  onRemove={() => dispatch({ type: 'REMOVE_ITEM', payload: { menuItemId: item.menuItemId } })}
                />
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t border-border px-5 pt-4 pb-4 bg-white">
            {error && <div className="mb-3 rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-black text-red-600 uppercase">{error}</div>}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-foreground/40">Tổng cộng</span>
              <span className="text-2xl font-black text-foreground tabular-nums">{formatVND(totalAmount)}</span>
            </div>
            <button onClick={handleSubmit} disabled={isSubmitting} className="w-full min-h-[56px] rounded-2xl bg-primary text-white font-black text-lg uppercase shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-30">
              {isSubmitting ? 'Đang gửi...' : 'Gửi đơn ngay'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function CartItemRow({ item, isUnavailable, onUpdateQuantity, onRemove }: { item: CartItem; isUnavailable?: boolean; onUpdateQuantity: (qty: number) => void; onRemove: () => void }) {
  return (
    <div className={`rounded-2xl bg-white p-4 border-2 ${isUnavailable ? 'border-red-500' : 'border-border'} shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-base text-foreground truncate">{item.name}</h3>
          <p className="text-sm font-black text-primary tabular-nums">{formatVND(item.price)}</p>
          {isUnavailable && <p className="text-[10px] font-black text-red-500 uppercase mt-1">Hết hàng</p>}
        </div>
        <button onClick={onRemove} className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground/20 active:text-red-500"><TrashIcon /></button>
      </div>
      <div className="mt-3 flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <button onClick={() => item.quantity <= 1 ? onRemove() : onUpdateQuantity(item.quantity - 1)} className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground font-black text-xl active:scale-90">−</button>
          <span className="w-8 text-center font-black text-lg text-foreground tabular-nums">{item.quantity}</span>
          <button onClick={() => onUpdateQuantity(item.quantity + 1)} className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground font-black text-xl active:scale-90">+</button>
        </div>
        <span className="font-black text-foreground tabular-nums">{formatVND(item.price * item.quantity)}</span>
      </div>
    </div>
  )
}

function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> }
function TrashIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg> }
