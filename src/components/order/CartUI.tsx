'use client'

import { useState, useCallback, type ReactNode } from 'react'
import CartBar from '@/components/order/CartBar'
import CartSheet from '@/components/order/CartSheet'
import type { OrderResult } from '@/components/order/CartSheet'
import OrderConfirmation from '@/components/order/OrderConfirmation'

type ViewState =
  | { view: 'menu' }
  | { view: 'confirmation'; order: OrderResult }

/**
 * Client wrapper managing cart sheet open/close + menu↔confirmation view state.
 * Wraps the menu content so it can swap to the confirmation screen.
 * Rendered inside CartProvider (added by server page).
 */
export default function CartUI({
  tableId,
  tableNumber,
  children,
}: {
  tableId: number
  tableNumber: number
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewState, setViewState] = useState<ViewState>({ view: 'menu' })

  const handleOpen = useCallback(() => setIsOpen(true), [])
  const handleClose = useCallback(() => setIsOpen(false), [])

  const handleOrderSuccess = useCallback((order: OrderResult) => {
    setViewState({ view: 'confirmation', order })
  }, [])

  const handleOrderMore = useCallback(() => {
    setViewState({ view: 'menu' })
  }, [])

  if (viewState.view === 'confirmation') {
    return (
      <OrderConfirmation
        order={viewState.order}
        tableNumber={tableNumber}
        onOrderMore={handleOrderMore}
      />
    )
  }

  return (
    <>
      {children}
      <CartBar onOpen={handleOpen} />
      <CartSheet
        isOpen={isOpen}
        onClose={handleClose}
        tableId={tableId}
        onOrderSuccess={handleOrderSuccess}
      />
    </>
  )
}
