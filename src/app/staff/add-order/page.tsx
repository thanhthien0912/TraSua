'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import { formatVND } from '@/lib/format'

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [tablesRes, menuRes] = await Promise.all([
          fetch('/api/admin/tables'),
          fetch('/api/staff/menu'),
        ])
        if (tablesRes.ok) setTables((await tablesRes.json()).tables ?? [])
        if (menuRes.ok) setMenuItems((await menuRes.json()).items ?? [])
      } catch {
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

  const handleAdd = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id)
      if (existing) return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const handleRemove = (menuItemId: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItemId)
      if (!existing) return prev
      if (existing.quantity > 1) return prev.map((c) => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c)
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
      if (!res.ok) { toast.error(data.error ?? 'Không thể tạo đơn'); return }
      toast.success('Đã tạo đơn thành công')
      router.push('/staff')
    } catch {
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const selectedTableName = tables.find((t) => t.id === selectedTable)?.name
  const filteredMenu = menuItems.filter((i) => i.available && i.category === activeCategory)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white border-b border-border shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-foreground">
              {step === 'table' ? 'Chọn bàn' : 'Chọn món'}
            </h1>
            {step === 'menu' && selectedTableName && (
              <p className="text-sm font-bold text-primary mt-0.5">{selectedTableName}</p>
            )}
          </div>
          {step === 'menu' && (
            <button
              onClick={() => { setStep('table'); setSelectedTable(null); setCart([]) }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-secondary text-foreground font-black text-sm uppercase active:scale-95 border border-border"
            >
              ← Đổi bàn
            </button>
          )}
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-5 pb-44">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-secondary border-t-primary rounded-full animate-spin" />
            <p className="font-bold text-foreground/50">Đang tải...</p>
          </div>
        ) : step === 'table' ? (
          /* ── Chọn bàn ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => handleTableSelect(table.id)}
                className="min-h-[100px] rounded-2xl bg-white border-2 border-border font-black text-foreground text-xl flex flex-col items-center justify-center gap-1 active:scale-95 hover:border-primary transition-all shadow-sm"
              >
                {table.name}
                <span className="text-xs font-bold text-foreground/30">#{table.number}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* ── Tab danh mục ── */}
            <div className="flex gap-2 mb-5">
              {(['DRINK', 'FOOD'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-1 min-h-[52px] rounded-xl font-black text-sm uppercase tracking-tight transition-all active:scale-95
                    ${activeCategory === cat
                      ? 'bg-foreground text-white'
                      : 'bg-white border border-border text-foreground/40'
                    }`}
                >
                  {cat === 'DRINK' ? '🧋 Đồ uống' : '🍜 Đồ ăn'}
                </button>
              ))}
            </div>

            {/* ── Danh sách món ── */}
            <div className="flex flex-col gap-3">
              {filteredMenu.map((item) => {
                const cartItem = cart.find((c) => c.menuItemId === item.id)
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 border border-border shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-base text-foreground truncate">{item.name}</p>
                      <p className="font-black text-primary text-sm mt-0.5">{formatVND(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {cartItem && (
                        <>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground font-black text-xl active:scale-90"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-black text-lg text-foreground tabular-nums">
                            {cartItem.quantity}
                          </span>
                        </>
                      )}
                      <button
                        onClick={() => handleAdd(item)}
                        className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl active:scale-90 shadow-md"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
              {filteredMenu.length === 0 && (
                <p className="text-center text-foreground/40 font-bold py-16">Không có món nào.</p>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Footer Tổng cộng — fixed, luôn hiển thị khi step=menu ── */}
      {step === 'menu' && (
        <div className="fixed bottom-16 left-0 right-0 z-30 bg-white border-t-2 border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-black uppercase text-foreground/40">Tổng cộng</p>
              <p className="text-2xl font-black text-foreground tabular-nums">{formatVND(totalAmount)}</p>
            </div>
            <span className="text-sm font-black text-foreground/40">{totalItems} món</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0}
            className="w-full min-h-[56px] rounded-2xl bg-primary text-white font-black text-lg uppercase shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                Đang tạo...
              </span>
            ) : (
              `Tạo đơn (${totalItems} món)`
            )}
          </button>
        </div>
      )}
    </div>
  )
}
