'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

// ─── Add Order Page ─────────────────────────────────────────────────

export default function AddOrderPage() {
  const router = useRouter()
  const toast = useToast()

  const [step, setStep] = useState<'table' | 'menu'>('table')
  const [tables, setTables] = useState<Table[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'DRINK' | 'FOOD'>('DRINK')

  // Fetch tables and menu on mount
  useEffect(() => {
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
        console.error('[AddOrderPage] Failed to fetch data:', error)
        toast.error('Không thể tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

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
      setStep('table')
      setSelectedTable(null)
      setCart([])
      router.push('/staff')
    } catch (error) {
      console.error('[AddOrderPage] Submit failed:', error)
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const selectedTableName = tables.find((t) => t.id === selectedTable)?.name

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with mint green gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" />
      
      {/* Decorative circles - subtle design elements */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl" />
      <div className="absolute top-40 right-10 w-48 h-48 bg-teal-200/20 rounded-full blur-2xl" />
      <div className="absolute bottom-40 -right-16 w-64 h-64 bg-cyan-200/20 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 sticky top-0 bg-white/80 backdrop-blur-xl border-b border-emerald-100 shadow-sm shadow-emerald-100/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {step === 'table' ? 'Chọn bàn' : 'Chọn món'}
              </h1>
              {step === 'menu' && selectedTableName && (
                <p className="text-sm text-emerald-600 mt-1 font-medium flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {selectedTableName}
                </p>
              )}
            </div>
            {step === 'menu' && (
              <button
                onClick={() => {
                  setStep('table')
                  setSelectedTable(null)
                  setCart([])
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm transition-all active:scale-95 border border-emerald-200/50"
              >
                ← Đổi bàn
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6 pb-48">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-emerald-600 font-medium">Đang tải...</p>
          </div>
        ) : step === 'table' ? (
          /* Table Selection */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tables.map((table, index) => (
              <button
                key={table.id}
                onClick={() => handleTableSelect(table.id)}
                className="min-h-[120px] rounded-2xl bg-white/90 backdrop-blur border border-emerald-100 hover:border-emerald-300 hover:bg-white transition-all p-6 text-center shadow-lg shadow-emerald-100/50 active:scale-95 group relative overflow-hidden"
                style={{ animationDelay: `${index * 50}ms`, animation: 'fadeSlideUp 0.4s ease-out both' }}
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 to-teal-400/0 group-hover:from-emerald-400/5 group-hover:to-teal-400/10 transition-all duration-300 rounded-2xl" />
                <div className="relative z-10">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{table.name}</div>
                  <div className="text-sm text-emerald-600 font-medium">#Bàn {table.number}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Category Tabs */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setActiveCategory('DRINK')}
                className={`flex-1 min-h-[56px] rounded-2xl font-bold text-lg transition-all relative overflow-hidden ${
                  activeCategory === 'DRINK'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30'
                    : 'bg-white/90 backdrop-blur text-gray-600 border-2 border-emerald-100 hover:border-emerald-300 hover:bg-white'
                }`}
              >
                🧋 Đồ uống
              </button>
              <button
                onClick={() => setActiveCategory('FOOD')}
                className={`flex-1 min-h-[56px] rounded-2xl font-bold text-lg transition-all relative overflow-hidden ${
                  activeCategory === 'FOOD'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30'
                    : 'bg-white/90 backdrop-blur text-gray-600 border-2 border-emerald-100 hover:border-emerald-300 hover:bg-white'
                }`}
              >
                🍜 Đồ ăn
              </button>
            </div>

            {/* Menu Selection */}
            <div className="space-y-3">
              {menuItems
                .filter((item) => item.available && item.category === activeCategory)
                .map((item, index) => {
                  const cartItem = cart.find((c) => c.menuItemId === item.id)
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg shadow-emerald-100/30 border border-emerald-100/50 transition-all hover:shadow-xl hover:shadow-emerald-100/40 hover:border-emerald-200/80"
                      style={{ animationDelay: `${index * 40}ms`, animation: 'fadeSlideUp 0.3s ease-out both' }}
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                        <p className="text-base text-emerald-600 font-bold mt-1">
                          {item.price.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {cartItem && (
                          <>
                            <button
                              onClick={() => handleRemoveFromCart(item.id)}
                              className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-xl transition-colors active:scale-90"
                            >
                              −
                            </button>
                            <span className="w-10 text-center font-bold text-xl text-gray-900 tabular-nums">
                              {cartItem.quantity}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center justify-center text-white font-bold text-xl transition-all shadow-lg shadow-emerald-500/30 active:scale-90"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </>
        )}
      </main>

      {/* Footer - only show in menu step */}
      {step === 'menu' && (
        <div className="fixed bottom-[56px] left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-emerald-200 shadow-xl shadow-emerald-100/50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg text-gray-700 font-semibold">Tổng cộng:</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tabular-nums">
                {totalAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0}
              className="w-full min-h-[56px] rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-lg shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo...
                </span>
              ) : (
                `Tạo đơn (${cart.length} món)`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}