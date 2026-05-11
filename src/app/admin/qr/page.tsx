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
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <h1 className="text-xl font-black text-foreground tracking-tight">
            📱 Mã QR Bàn
          </h1>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────── */}
      <main className="px-5 pb-28 pt-8">
        <div className="flex flex-col items-center text-center">
          {/* QR illustration */}
          <div
            className="mb-8 flex items-center justify-center rounded-[2.5rem] bg-secondary/30 p-10 border-2 border-dashed border-primary/20"
          >
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-xl bg-foreground"
                  style={{ opacity: [1,0,1,0,1,1,1,0,1][i] === 1 ? 1 : 0.05 }}
                />
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-black text-foreground mb-3">
            In mã QR đặt món
          </h2>
          <p
            className="text-base text-foreground/60 mb-10 max-w-xs"
          >
            Hệ thống sẽ tạo file PDF chứa mã QR cho tất cả bàn. Bạn chỉ cần in ra và dán tại bàn.
          </p>

          {/* Table count */}
          <div className="mb-8 w-full max-w-xs flex flex-col items-center gap-1 rounded-3xl bg-white border border-border p-6 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">
              Tổng số bàn
            </span>
            {loading ? (
              <div className="animate-pulse h-10 w-16 bg-secondary rounded-lg mt-2" />
            ) : (
              <span className="text-5xl font-black text-primary tabular-nums">
                {tableCount ?? '0'}
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 w-full max-w-xs rounded-2xl bg-red-50 border border-red-100 p-4 text-sm font-bold text-red-600 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span className="text-left leading-tight">{error}</span>
            </div>
          )}

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={downloading || loading || tableCount === 0}
            className="min-h-[64px] w-full max-w-xs inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-4 text-lg font-black uppercase text-white shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-30 disabled:grayscale"
          >
            {downloading ? (
              <>
                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Tải File PDF
              </>
            )}
          </button>

          {tableCount === 0 && !loading && (
            <p className="mt-4 text-sm font-bold text-red-500">
              Vui lòng thêm bàn trước khi tạo mã QR.
            </p>
          )}

          <p className="mt-6 text-xs font-bold text-foreground/30">
            Mỗi bàn cần in 1 mã QR và dán tại bàn tương ứng.
          </p>
        </div>
      </main>
    </>
  )
}
