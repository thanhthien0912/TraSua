'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/ToastProvider'

// ─── Types ──────────────────────────────────────────────────────────

interface MenuItem {
  id: number
  name: string
  price: number
  category: 'DRINK' | 'FOOD'
  available: boolean
}

interface Table {
  id: number
  number: number
  name: string
}

interface CartItem {
  menuItemId: number
  name: string
  price: number
  quantity: number
}

interface AddOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// ─── Add Order Modal ────────────────────────────────────────────────

export default function AddOrderModal({ isOpen, onClose, onSuccess }: AddOrderModalProps) {
  const toast = useToast()

  const [step, setStep] = useState<'table' | 'menu'>('table')
  const [tables, setTables] = useState<Table[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fetch tables and menu when modal opens
  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [tablesRes, menuRes] = await Promise.all([
          fetch('/api/admin/tables'),
          fetch('/api/staff/menu'),
        ])

        if (tablesRes.ok) {
          const data = await tablesRes.json()
          setTables(data.tables ?? [])
        }

        if (menuRes.ok) {
          const data = await menuRes.json()
          setMenuItems(data.items ?? [])
        }
      } catch (error) {
        console.error('[AddOrderModal] Failed to fetch data:', error)
        toast.error('Không thể tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, toast])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('table')
      setSelectedTable(null)
      setCart([])
    }
  }, [isOpen])

  const handleTableSelect = (tableId: number) => {
    setSelectedTable(tableId)
    setStep('menu')
  }

  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id)
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const handleRemoveFromCart = (menuItemId: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItemId)
      if (!existing) return prev
      if (existing.quantity > 1) {
        return prev.map((c) =>
          c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c
        )
      }
      return prev.filter((c) => c.menuItemId !== menuItemId)
    })
  }

  const handleSubmit = async () => {
    if (!selectedTable || cart.length === 0) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable,
          items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Không thể tạo đơn')
        return
      }

      toast.success('Đã tạo đơn thành công')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('[AddOrderModal] Submit failed:', error)
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const selectedTableName = tables.find((t) => t.id === selectedTable)?.name

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {step === 'table' ? 'Chọn bàn' : 'Chọn món'}
              </h2>
              {step === 'menu' && selectedTableName && (
                <p className="text-sm text-gray-600 mt-1">{selectedTableName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : step === 'table' ? (
            /* Table Selection */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleTableSelect(table.id)}
                  className="min-h-[80px] rounded-2xl bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all p-4 text-center active:scale-95"
                >
                  <div className="text-2xl font-bold text-gray-900">{table.name}</div>
                  <div className="text-sm text-gray-600 mt-1">#{table.number}</div>
                </button>
              ))}
            </div>
          ) : (
            /* Menu Selection */
            <div className="space-y-3">
              {menuItems
                .filter((item) => item.available)
                .map((item) => {
                  const cartItem = cart.find((c) => c.menuItemId === item.id)
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-orange-600 font-semibold mt-1">
                          {item.price.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {cartItem && (
                          <>
                            <button
                              onClick={() => handleRemoveFromCart(item.id)}
                              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-bold text-gray-900">
                              {cartItem.quantity}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="w-10 h-10 rounded-xl bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'menu' && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 font-semibold">Tổng cộng:</span>
              <span className="text-2xl font-bold text-orange-600">
                {totalAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('table')}
                disabled={submitting}
                className="flex-1 min-h-[52px] rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors disabled:opacity-50"
              >
                ← Đổi bàn
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || cart.length === 0}
                className="flex-[2] min-h-[52px] rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang tạo...' : `Tạo đơn (${cart.length} món)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
