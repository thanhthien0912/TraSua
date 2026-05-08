'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { formatVND } from '@/lib/format'
import { useToast } from '@/components/ui/ToastProvider'
import MenuItemForm, { type MenuItemData } from '@/components/admin/MenuItemForm'
import { SkeletonMenuRow } from '@/components/ui/Skeleton'

// ─── Types ──────────────────────────────────────────────────────────

interface MenuItem {
  id: number
  name: string
  price: number
  category: 'DRINK' | 'FOOD'
  description: string | null
  available: boolean
  hidden: boolean
  sortOrder: number
}

type Tab = 'DRINK' | 'FOOD'

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'DRINK', label: 'Đồ uống', emoji: '🧋' },
  { key: 'FOOD', label: 'Đồ ăn', emoji: '🍜' },
]

// ─── Admin Menu Page ────────────────────────────────────────────────

export default function AdminMenuPage() {
  const toast = useToast()

  // ─── Data state ─────────────────────────────────────────────
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('DRINK')

  // ─── Form modal state ───────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<MenuItemData | null>(null)

  // ─── Fetch menu items ───────────────────────────────────────
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/menu')
      if (!res.ok) throw new Error(`Lỗi tải thực đơn (${res.status})`)
      const data = await res.json()
      setItems(data.items ?? [])
      setError(null)
      console.log(`[AdminMenu] Loaded ${data.items?.length ?? 0} menu items`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
      setError(msg)
      console.error('[AdminMenu] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // ─── Toggle availability ────────────────────────────────────
  const handleToggleAvailable = useCallback(
    async (item: MenuItem) => {
      const newValue = !item.available
      try {
        const res = await fetch(`/api/admin/menu/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: 'available', value: newValue }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          toast.error(data.error ?? 'Không thể cập nhật trạng thái')
          return
        }
        toast.success(
          newValue
            ? `"${item.name}" đã chuyển về Còn hàng`
            : `"${item.name}" đã chuyển sang Hết hàng`,
        )
        console.log(`[AdminMenu] Toggled available=${newValue} for: ${item.name}`)
        fetchItems()
      } catch {
        toast.error('Lỗi kết nối. Vui lòng thử lại.')
      }
    },
    [fetchItems, toast],
  )

  // ─── Soft-delete (hide) ─────────────────────────────────────
  const handleDelete = useCallback(
    async (item: MenuItem) => {
      try {
        const res = await fetch(`/api/admin/menu/${item.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          toast.error(data.error ?? 'Không thể xoá món')
          return
        }
        toast.success(`Đã ẩn "${item.name}"`)
        console.log(`[AdminMenu] Soft-deleted: ${item.name}`)
        fetchItems()
      } catch {
        toast.error('Lỗi kết nối. Vui lòng thử lại.')
      }
    },
    [fetchItems, toast],
  )

  // ─── Restore (unhide) ──────────────────────────────────────
  const handleRestore = useCallback(
    async (item: MenuItem) => {
      try {
        const res = await fetch(`/api/admin/menu/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: 'hidden', value: false }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          toast.error(data.error ?? 'Không thể khôi phục món')
          return
        }
        toast.success(`Đã khôi phục "${item.name}"`)
        console.log(`[AdminMenu] Restored: ${item.name}`)
        fetchItems()
      } catch {
        toast.error('Lỗi kết nối. Vui lòng thử lại.')
      }
    },
    [fetchItems, toast],
  )

  // ─── Open create form ───────────────────────────────────────
  const handleCreate = useCallback(() => {
    setEditItem(null)
    setShowForm(true)
  }, [])

  // ─── Open edit form ─────────────────────────────────────────
  const handleEdit = useCallback((item: MenuItem) => {
    setEditItem({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description,
      sortOrder: item.sortOrder,
    })
    setShowForm(true)
  }, [])

  // ─── Form success callback ─────────────────────────────────
  const handleFormSuccess = useCallback(() => {
    toast.success(editItem ? 'Đã cập nhật món' : 'Đã tạo món mới')
    fetchItems()
  }, [editItem, fetchItems, toast])

  // ─── Filter items for active tab ────────────────────────────
  const filtered = items
    .filter((item) => item.category === activeTab)
    .sort((a, b) => {
      // Hidden items go to bottom
      if (a.hidden !== b.hidden) return a.hidden ? 1 : -1
      return a.sortOrder - b.sortOrder
    })

  // ─── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-4 pb-28 pt-4">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonMenuRow key={i} />
          ))}
        </div>
      </div>
    )
  }

  // ─── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <span className="text-4xl mb-3 opacity-50">⚠️</span>
        <p className="text-emerald-800 font-medium mb-4">{error}</p>
        <button
          onClick={() => {
            setLoading(true)
            setError(null)
            fetchItems()
          }}
          className="min-h-[44px] px-6 py-2 rounded-xl bg-emerald-700 text-emerald-50 font-semibold text-sm hover:bg-emerald-800 transition-colors active:scale-[0.96]"
          style={{ transitionProperty: 'background-color, transform' }}
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h1
            className="text-xl font-bold text-gray-900 tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            📋 Quản lý thực đơn
          </h1>
          <button
            onClick={handleCreate}
            className="min-h-[48px] inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 px-5 py-3 text-base font-bold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all active:scale-[0.96]"
            style={{ transitionProperty: 'box-shadow, transform' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Thêm món
          </button>
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
              const count = items.filter(
                (i) => i.category === tab.key && !i.hidden,
              ).length
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex-1 rounded-xl px-5 py-3 text-base font-bold
                    transition-all duration-200 ease-out
                    ${
                      isActive
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                  style={{ minHeight: 48 }}
                >
                  {tab.emoji} {tab.label}{' '}
                  <span
                    className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-500'}`}
                  >
                    ({count})
                  </span>
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
        className="px-5 pb-28 pt-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, index) => (
            <AdminItemCard
              key={item.id}
              item={item}
              index={index}
              onEdit={handleEdit}
              onToggleAvailable={handleToggleAvailable}
              onDelete={handleDelete}
              onRestore={handleRestore}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-6xl mb-4 opacity-40">
              {activeTab === 'DRINK' ? '🧋' : '🍜'}
            </span>
            <p
              className="text-base text-gray-500 mb-6"
              style={{ textWrap: 'pretty' }}
            >
              Chưa có món nào trong danh mục này.
            </p>
            <button
              onClick={handleCreate}
              className="min-h-[48px] inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 px-6 py-3 text-base font-bold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all active:scale-[0.96]"
              style={{ transitionProperty: 'box-shadow, transform' }}
            >
              Thêm món đầu tiên
            </button>
          </div>
        )}
      </main>

      {/* ── Create/Edit Form Modal ─────────────────────────────── */}
      <MenuItemForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
        editItem={editItem}
      />
    </>
  )
}

// ─── Admin Item Card ────────────────────────────────────────────────

function AdminItemCard({
  item,
  index,
  onEdit,
  onToggleAvailable,
  onDelete,
  onRestore,
}: {
  item: MenuItem
  index: number
  onEdit: (item: MenuItem) => void
  onToggleAvailable: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
  onRestore: (item: MenuItem) => void
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-reset delete confirmation after 3s
  useEffect(() => {
    if (confirmingDelete) {
      deleteTimerRef.current = setTimeout(() => setConfirmingDelete(false), 3000)
    }
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
        deleteTimerRef.current = null
      }
    }
  }, [confirmingDelete])

  const handleDeleteTap = useCallback(() => {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    // Second tap — execute
    setConfirmingDelete(false)
    onDelete(item)
  }, [confirmingDelete, item, onDelete])

  const isHidden = item.hidden
  const isUnavailable = !item.available

  return (
    <div
      className={`
        rounded-2xl bg-white p-5 border border-gray-200
        transition-all duration-200 ease-out
        ${isHidden ? 'opacity-50' : 'hover:shadow-lg hover:border-teal-200'}
      `}
      style={{
        boxShadow: isHidden
          ? 'none'
          : '0 2px 8px rgba(0, 0, 0, 0.04)',
        animationDelay: `${index * 50}ms`,
        animation: 'adminCardEnter 0.3s ease-out both',
      }}
    >
      {/* ─── Top row: name + badges ──────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3
            className={`text-lg font-bold leading-snug ${
              isHidden ? 'text-gray-400' : 'text-gray-900'
            }`}
            style={{ textWrap: 'balance' }}
          >
            {item.name}
          </h3>
          {item.description && (
            <p
              className={`mt-2 text-sm leading-relaxed ${
                isHidden ? 'text-gray-400' : 'text-gray-600'
              }`}
              style={{ textWrap: 'pretty' }}
            >
              {item.description}
            </p>
          )}
        </div>

        {/* Badges column */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {isHidden && (
            <span className="inline-flex items-center rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
              Đã ẩn
            </span>
          )}
          {isUnavailable && !isHidden && (
            <span className="inline-flex items-center rounded-xl bg-teal-100 px-3 py-1.5 text-xs font-semibold text-orange-700">
              Hết hàng
            </span>
          )}
        </div>
      </div>

      {/* ─── Price + sort order ──────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`text-base font-bold ${
            isHidden ? 'text-gray-400' : 'text-teal-600'
          }`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatVND(item.price)}
        </span>
        {item.sortOrder !== 0 && (
          <span className="text-xs text-gray-400">
            #{item.sortOrder}
          </span>
        )}
      </div>

      {/* ─── Action buttons ──────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {isHidden ? (
          /* Restore button for hidden items */
          <button
            onClick={() => onRestore(item)}
            className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors active:scale-[0.96]"
            style={{ transitionProperty: 'background-color, transform' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
              />
            </svg>
            Khôi phục
          </button>
        ) : (
          <>
            {/* Edit */}
            <button
              onClick={() => onEdit(item)}
              className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors active:scale-[0.96]"
              style={{ transitionProperty: 'background-color, transform' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                />
              </svg>
              Sửa
            </button>

            {/* Toggle availability */}
            <button
              onClick={() => onToggleAvailable(item)}
              className={`
                min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border
                transition-colors active:scale-[0.96]
                ${
                  item.available
                    ? 'bg-teal-50 text-orange-700 border-teal-200 hover:bg-teal-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }
              `}
              style={{ transitionProperty: 'background-color, transform' }}
            >
              {item.available ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  Hết hàng
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Còn hàng
                </>
              )}
            </button>

            {/* Delete (two-tap) */}
            <button
              onClick={handleDeleteTap}
              className={`
                min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold
                transition-all duration-150 active:scale-[0.96]
                ${
                  confirmingDelete
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                    : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                }
              `}
              style={{ transitionProperty: 'background-color, color, transform, box-shadow' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              {confirmingDelete ? 'Xác nhận xoá?' : 'Ẩn món'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
