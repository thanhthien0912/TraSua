'use client'

import { useState, useEffect, useCallback } from 'react'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function AdminQRPage() {
  const [tableCount, setTableCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTableCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tables')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTableCount(data.tables?.length ?? 0)
    } catch {
      setTableCount(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTableCount()
  }, [fetchTableCount])

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/qr-pdf')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Không thể tải file QR')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'trasua-qr-codes.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setDownloading(false)
    }
  }, [])

  return (
    <>
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-emerald-50/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-lg font-bold text-emerald-950 tracking-tight">
            📱 QR Code
          </h1>
        </div>
        <div className="h-px bg-emerald-200/50" />
      </header>

      {/* ── Content ───────────────────────────────────────────── */}
      <main className="px-4 pb-28 pt-6">
        <div className="flex flex-col items-center text-center">
          {/* QR illustration */}
          <div
            className="mb-6 flex items-center justify-center rounded-3xl bg-emerald-50 p-8"
            style={{
              boxShadow: '0 0 0 1px rgba(16, 185, 129,0.12), 0 4px 24px rgba(16, 185, 129,0.08)',
            }}
          >
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-lg bg-emerald-900"
                  style={{ opacity: [1,0,1,0,1,1,1,0,1][i] === 1 ? 1 : 0.15 }}
                />
              ))}
            </div>
          </div>

          <h2 className="text-xl font-bold text-emerald-950 mb-2">
            Tải mã QR cho bàn
          </h2>
          <p
            className="text-sm text-emerald-700/65 mb-8 max-w-xs"
            style={{ textWrap: 'pretty' }}
          >
            File PDF A4 gồm lưới 3×5 chứa mã QR cho tất cả bàn hiện có trong hệ thống.
          </p>

          {/* Table count */}
          <div className="mb-6 inline-flex flex-col items-center gap-1 rounded-2xl bg-white px-8 py-5" style={{ boxShadow: '0 1px 3px rgba(16, 185, 129,0.06), 0 4px 12px rgba(16, 185, 129,0.04)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500/70">
              Số bàn hiện tại
            </span>
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <SkeletonCard className="w-16 h-10 rounded-lg" />
                <SkeletonCard className="w-24 h-3 rounded" />
              </div>
            ) : (
              <>
                <span className="text-4xl font-bold text-emerald-950 tabular-nums">
                  {tableCount ?? '—'}
                </span>
                <span className="text-xs text-emerald-500/60">
                  {tableCount === 1 ? 'bàn' : 'bàn'}
                </span>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={downloading || loading}
            className="min-h-[52px] w-full max-w-xs inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-8 py-3.5 text-base font-bold text-emerald-50 shadow-sm shadow-emerald-900/20 hover:bg-emerald-900 transition-colors active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ transitionProperty: 'background-color, transform' }}
          >
            {downloading ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-emerald-200 border-t-amber-50 rounded-full animate-spin" />
                Đang tải...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Tải file PDF
              </>
            )}
          </button>

          <p className="mt-3 text-xs text-emerald-500/70">
            Mỗi bàn cần in 1 mã QR và dán tại bàn tương ứng.
          </p>
        </div>
      </main>
    </>
  )
}
