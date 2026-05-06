'use client'

import { useState, useCallback } from 'react'
import CartBar from '@/components/order/CartBar'
import CartSheet from '@/components/order/CartSheet'

/**
 * Client wrapper that manages cart sheet open/close state.
 * Rendered inside CartProvider (added by server page).
 */
export default function CartUI() {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = useCallback(() => setIsOpen(true), [])
  const handleClose = useCallback(() => setIsOpen(false), [])

  return (
    <>
      <CartBar onOpen={handleOpen} />
      <CartSheet isOpen={isOpen} onClose={handleClose} />
    </>
  )
}
