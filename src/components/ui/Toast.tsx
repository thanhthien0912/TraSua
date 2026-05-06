'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// ─── Types ──────────────────────────────────────────────────────────

export interface ToastData {
  id: string
  message: string
  variant: 'success' | 'error'
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

// ─── Single Toast ───────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger slide-in
    const frameId = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      // Wait for exit animation before removing
      setTimeout(() => onDismiss(toast.id), 200)
    }, 3000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const bg =
    toast.variant === 'success'
      ? 'bg-emerald-600'
      : 'bg-red-600'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        ${bg} text-white text-sm font-medium
        px-4 py-3 rounded-xl shadow-lg
        transition-all duration-200 ease-out
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}
      `}
    >
      <span className="mr-2" aria-hidden="true">
        {toast.variant === 'success' ? '✓' : '✕'}
      </span>
      {toast.message}
    </div>
  )
}

// ─── Toast Container (Portal) ───────────────────────────────────────

export default function ToastContainer({ toasts, onDismiss }: {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || toasts.length === 0) return null

  return createPortal(
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col-reverse gap-2 w-[min(90vw,360px)] pointer-events-none"
      aria-label="Thông báo"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>,
    document.body,
  )
}
