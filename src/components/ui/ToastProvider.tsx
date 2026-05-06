'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import ToastContainer, { type ToastData } from './Toast'

// ─── Context ────────────────────────────────────────────────────────

interface ToastAPI {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastAPI | null>(null)

// ─── Hook ───────────────────────────────────────────────────────────

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

// ─── Provider ───────────────────────────────────────────────────────

let nextId = 0

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((message: string, variant: ToastData['variant']) => {
    const id = `toast-${++nextId}-${Date.now()}`
    setToasts((prev) => [...prev, { id, message, variant }])
  }, [])

  const api: ToastAPI = {
    success: useCallback((msg: string) => push(msg, 'success'), [push]),
    error: useCallback((msg: string) => push(msg, 'error'), [push]),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
