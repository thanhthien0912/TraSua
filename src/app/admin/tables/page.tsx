'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { SkeletonTableCard } from '@/components/ui/Skeleton'

// ─── Types ──────────────────────────────────────────────────────────

interface TableItem {
  id: number
  number: number
  name: string
  orderCount: number
}

// ─── Admin Tables Page ─────────────────────────────────────────────

export default function AdminTablesPage() {
  const toast = useToast()

  const [tables, setTables] = useState<TableItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  // Delete confirmation state per table
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-reset delete confirmation after 3s
  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
    }
  }, [])

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tables')
      if (!res.ok) throw new Error(`Lỗi tải danh sách bàn (${res.status})`)
      const data = await res.json()
      setTables(data.tables ?? [])
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  // ─── Add table ───────────────────────────────────────────────
  const handleAdd = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tables', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Không thể tạo bàn mới')
        return
      }
      toast.success(`Đã tạo "${data.table.name}"`)
      fetchTables()
    } catch {
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
    }
  }, [fetchTables, toast])

  // ─── Start editing ────────────────────────────────────────────
  const startEdit = useCallback((table: TableItem) => {
    setEditingId(table.id)
    setEditName(table.name)
  }, [])

  // ─── Save edit ───────────────────────────────────────────────
  const saveEdit = useCallback(async (id: number) => {
    if (!editName.trim()) {
      toast.error('Tên bàn không được để trống')
      return
    }
    try {
      const res = await fetch(`/api/admin/tables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Không thể cập nhật')
        return
      }
      toast.success(`Đã đổi tên thành "${data.table.name}"`)
      setEditingId(null)
      fetchTables()
    } catch {
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
    }
  }, [editName, fetchTables, toast])

  // ─── Delete ────────────────────────────────────────────────
  const handleDeleteTap = useCallback((table: TableItem) => {
    if (confirmingDelete !== table.id) {
      setConfirmingDelete(table.id)
      deleteTimerRef.current = setTimeout(() => setConfirmingDelete(null), 3000)
      return
    }
    // Second tap
    setConfirmingDelete(null)
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)

    ;(async () => {
      try {
        const res = await fetch(`/api/admin/tables/${table.id}`, { method: 'DELETE' })
        
        // Success: 204 No Content (no body to parse)
        if (res.status === 204) {
          toast.success(`Đã xoá "${table.name}"`)
          fetchTables()
          return
        }
        
        // Error: parse JSON error message
        const data = await res.json()
        if (res.status === 409) {
          toast.error(data.error ?? 'Bàn đang có đơn chưa thanh toán')
        } else {
          toast.error(data.error ?? 'Không thể xoá bàn')
        }
      } catch {
        toast.error('Lỗi kết nối. Vui lòng thử lại.')
      }
    })()
  }, [confirmingDelete, fetchTables, toast])

  // ─── Cancel edit ─────────────────────────────────────────────
  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditName('')
  }, [])

  // ─── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        {/* ── Header ────────────────────────────────────────────── */}
        <header className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h1 className="text-lg font-bold text-emerald-950 tracking-tight">
              🪑 Quản lý bàn
            </h1>
          </div>
          <div className="h-px bg-emerald-200/50" />
        </header>
        {/* ── Skeleton rows ─────────────────────────────────────── */}
        <main className="px-4 pb-28 pt-4">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonTableCard key={i} />
            ))}
          </div>
        </main>
      </>
    )
  }

  // ─── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <>
        {/* ── Header ────────────────────────────────────────────── */}
        <header className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h1 className="text-lg font-bold text-emerald-950 tracking-tight">
              🪑 Quản lý bàn
            </h1>
          </div>
          <div className="h-px bg-emerald-200/50" />
        </header>
        {/* ── Error state ────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <span className="text-4xl mb-3 opacity-50">⚠️</span>
          <p className="text-emerald-800 font-medium mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); fetchTables() }}
            className="min-h-[44px] px-6 py-2 rounded-xl bg-emerald-700 text-emerald-50 font-semibold text-sm hover:bg-emerald-800 transition-colors active:scale-[0.96]"
          >
            Thử lại
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-lg font-bold text-emerald-950 tracking-tight">
            🪑 Quản lý bàn
          </h1>
          <button
            onClick={handleAdd}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-50 shadow-sm shadow-emerald-900/20 hover:bg-emerald-900 transition-colors active:scale-[0.96]"
            style={{ transitionProperty: 'background-color, transform' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Thêm bàn
          </button>
        </div>
        <div className="h-px bg-emerald-200/50" />
      </header>

      {/* ── Table List ─────────────────────────────────────────── */}
      <main className="px-4 pb-28 pt-4">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3 opacity-40">🪑</span>
            <p className="text-sm text-emerald-700/60" style={{ textWrap: 'pretty' }}>
              Chưa có bàn nào.
            </p>
            <button
              onClick={handleAdd}
              className="mt-4 min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-200 transition-colors active:scale-[0.96]"
            >
              Thêm bàn đầu tiên
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tables.map((table, index) => (
              <div
                key={table.id}
                className="rounded-2xl bg-white p-4"
                style={{
                  boxShadow: '0 1px 3px rgba(16, 185, 129, 0.06), 0 4px 12px rgba(16, 185, 129, 0.04)',
                  animationDelay: `${index * 50}ms`,
                  animation: 'adminCardEnter 0.3s ease-out both',
                }}
              >
                {editingId === table.id ? (
                  /* ── Inline Edit Mode ────────────────────────── */
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(table.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="min-h-[44px] w-full rounded-xl border-2 border-emerald-400 bg-emerald-50 px-4 py-2 text-[15px] font-semibold text-emerald-950 placeholder-amber-400/60 outline-none focus:border-emerald-600 transition-colors"
                      placeholder="Tên bàn..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(table.id)}
                        className="min-h-[40px] flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-700 transition-colors active:scale-[0.96]"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="min-h-[40px] flex-1 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-200 transition-colors active:scale-[0.96]"
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View Mode ──────────────────────────────── */
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-[15px] font-semibold text-emerald-950 leading-snug">
                          {table.name}
                        </h3>
                        <p className="text-sm text-emerald-700/65 mt-0.5">
                          {table.orderCount > 0
                            ? `📋 ${table.orderCount} đơn chưa thanh toán`
                            : 'Không có đơn chưa thanh toán'}
                        </p>
                      </div>
                      <span className="flex-shrink-0 inline-flex items-center rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700/70">
                        #{table.number}
                      </span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => startEdit(table)}
                        className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200/60 hover:bg-emerald-100 transition-colors active:scale-[0.96]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                        Đổi tên
                      </button>

                      <button
                        onClick={() => handleDeleteTap(table)}
                        className={`
                          min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold
                          transition-all duration-150 active:scale-[0.96]
                          ${
                            confirmingDelete === table.id
                              ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                              : 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-100'
                          }
                        `}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        {confirmingDelete === table.id ? 'Xác nhận xoá?' : 'Xoá'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
