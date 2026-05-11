'use client'

import { useState } from 'react'
import { formatVND } from '@/lib/format'
import { useCart } from '@/components/order/CartProvider'

// ─── Types ──────────────────────────────────────────────────────────
export type SerializedMenuItem = {
  id: number
  name: string
  category: 'DRINK' | 'FOOD'
  price: number
  description: string | null
  available: boolean
  sortOrder: number
}

type Tab = 'DRINK' | 'FOOD'

const TABS: { key: Tab; label: string }[] = [
  { key: 'DRINK', label: 'Đồ uống' },
  { key: 'FOOD', label: 'Đồ ăn' },
]

// ─── MenuView ───────────────────────────────────────────────────────
export default function MenuView({
  menuItems,
  table,
}: {
  menuItems: SerializedMenuItem[]
  table: { id: number; number: number; name: string }
}) {
  const { dispatch } = useCart()
  const [activeTab, setActiveTab] = useState<Tab>('DRINK')

  function handleAdd(item: SerializedMenuItem) {
    dispatch({
      type: 'ADD_ITEM',
      payload: { menuItemId: item.id, name: item.name, price: item.price },
    })
  }

  const filtered = menuItems
    .filter((item) => item.category === activeTab)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <span className="text-2xl" aria-hidden="true">
            🧋
          </span>
          <h1
            className="text-xl font-bold text-gray-900"
            style={{ textWrap: 'balance' }}
          >
            {table.name}
          </h1>
        </div>

        {/* ── Tab Bar ──────────────────────────────────────────── */}
        <div className="px-5 py-4 bg-gray-50/50">
          <nav
            role="tablist"
            aria-label="Danh mục thực đơn"
            className="inline-flex w-full rounded-2xl bg-white shadow-sm border border-gray-200 p-1.5"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex-1 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-widest
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-foreground text-white' // Tab chọn dùng màu Nâu đen cực đậm
                        : 'bg-white text-foreground/40 border border-border'
                    }
                  `}
                  style={{ minHeight: 52 }}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* ── Item List ──────────────────────────────────────────── */}
      <main
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-label={TABS.find((t) => t.key === activeTab)?.label}
        className="px-5 pb-24 pt-5"
      >
        <div className="flex flex-col gap-4">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} onAdd={handleAdd} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p
            className="py-16 text-center text-base text-gray-500"
            style={{ textWrap: 'pretty' }}
          >
            Chưa có món nào trong danh mục này.
          </p>
        )}
      </main>
    </>
  )
}

// ─── Item Card ──────────────────────────────────────────────────────
function ItemCard({
  item,
  onAdd,
}: {
  item: SerializedMenuItem
  onAdd: (item: SerializedMenuItem) => void
}) {
  const unavailable = !item.available

  return (
    <div
      className={`
        relative rounded-2xl bg-white p-5 border border-gray-200
        transition-all duration-200 ease-out
        ${
          unavailable
            ? 'opacity-50'
            : 'hover:shadow-md hover:border-primary/30 active:scale-[0.98] cursor-pointer'
        }
      `}
      style={{
        boxShadow: unavailable
          ? 'none'
          : '0 4px 12px rgba(74, 55, 40, 0.05)',
      }}
      aria-disabled={unavailable || undefined}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: name + description */}
        <div className="min-w-0 flex-1">
          <h3
            className={`text-lg font-bold leading-snug ${
              unavailable ? 'text-gray-400' : 'text-gray-900'
            }`}
            style={{ textWrap: 'balance' }}
          >
            {item.name}
          </h3>

          {item.description && (
            <p
              className={`mt-2 text-sm leading-relaxed ${
                unavailable
                  ? 'text-gray-400'
                  : 'text-gray-600'
              }`}
              style={{ textWrap: 'pretty' }}
            >
              {item.description}
            </p>
          )}

          {/* Price */}
          <p
            className={`mt-3 text-lg font-bold ${
              unavailable ? 'text-gray-400' : 'text-primary'
            }`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatVND(item.price)}
          </p>
        </div>

        {/* Right: badge or add affordance */}
        <div className="flex-shrink-0 pt-1">
          {unavailable ? (
            <span className="inline-flex items-center rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-500">
              Hết hàng
            </span>
          ) : (
            <button
              type="button"
              aria-label={`Thêm ${item.name}`}
              onClick={(e) => {
                e.stopPropagation()
                onAdd(item)
              }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg active:scale-90 transition-transform"
              style={{ minHeight: 56, minWidth: 56 }}
            >
              <PlusIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Plus Icon ──────────────────────────────────────────────────────
function PlusIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="12" y1="6" x2="12" y2="18" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  )
}
