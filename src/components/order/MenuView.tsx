'use client'

import { useState } from 'react'
import { formatVND } from '@/lib/format'

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
  const [activeTab, setActiveTab] = useState<Tab>('DRINK')

  const filtered = menuItems
    .filter((item) => item.category === activeTab)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-amber-50/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="text-lg" aria-hidden="true">
            🧋
          </span>
          <h1
            className="text-base font-semibold text-amber-950"
            style={{ textWrap: 'balance' }}
          >
            {table.name}
          </h1>
        </div>

        {/* ── Tab Bar ──────────────────────────────────────────── */}
        <div className="px-4 pb-3">
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
                  aria-controls={`panel-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold
                    transition-colors transition-shadow duration-150 ease-out
                    ${
                      isActive
                        ? 'bg-amber-900 text-amber-50 shadow-sm shadow-amber-900/20'
                        : 'text-amber-700 hover:text-amber-900'
                    }
                  `}
                  style={{ minHeight: 44 }}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom edge shadow */}
        <div className="h-px bg-amber-200/50" />
      </header>

      {/* ── Item List ──────────────────────────────────────────── */}
      <main
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-label={TABS.find((t) => t.key === activeTab)?.label}
        className="px-4 pb-8 pt-4"
      >
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p
            className="py-12 text-center text-sm text-amber-700/60"
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
function ItemCard({ item }: { item: SerializedMenuItem }) {
  const unavailable = !item.available

  return (
    <div
      className={`
        relative rounded-2xl bg-white p-4
        transition-transform duration-150 ease-out
        ${
          unavailable
            ? 'opacity-55'
            : 'active:scale-[0.96] cursor-pointer'
        }
      `}
      style={{
        boxShadow: unavailable
          ? '0 1px 2px rgba(120, 53, 15, 0.04)'
          : '0 1px 3px rgba(120, 53, 15, 0.06), 0 4px 12px rgba(120, 53, 15, 0.04)',
      }}
      aria-disabled={unavailable || undefined}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: name + description */}
        <div className="min-w-0 flex-1">
          <h3
            className={`text-[15px] font-semibold leading-snug ${
              unavailable ? 'text-amber-800/60' : 'text-amber-950'
            }`}
            style={{ textWrap: 'balance' }}
          >
            {item.name}
          </h3>

          {item.description && (
            <p
              className={`mt-1 text-sm leading-relaxed ${
                unavailable
                  ? 'text-amber-700/40'
                  : 'text-amber-700/65'
              }`}
              style={{ textWrap: 'pretty' }}
            >
              {item.description}
            </p>
          )}

          {/* Price */}
          <p
            className={`mt-2 text-sm font-semibold ${
              unavailable ? 'text-amber-700/50' : 'text-amber-800'
            }`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatVND(item.price)}
          </p>
        </div>

        {/* Right: badge or add affordance */}
        <div className="flex-shrink-0 pt-0.5">
          {unavailable ? (
            <span className="inline-flex items-center rounded-lg bg-amber-100/80 px-2.5 py-1 text-xs font-medium text-amber-700/70">
              Hết hàng
            </span>
          ) : (
            <button
              type="button"
              aria-label={`Thêm ${item.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-900 text-amber-50 transition-transform duration-150 ease-out active:scale-[0.92]"
              style={{ minHeight: 36, minWidth: 36 }}
              tabIndex={-1}
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
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="9" y1="4" x2="9" y2="14" />
      <line x1="4" y1="9" x2="14" y2="9" />
    </svg>
  )
}
