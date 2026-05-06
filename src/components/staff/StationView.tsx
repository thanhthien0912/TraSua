'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useOrderStream, type Station, type Order } from './useOrderStream'
import { useNotification } from './useNotification'
import OrderCard from './OrderCard'

// ─── Station Labels ─────────────────────────────────────────────────

const STATION_LABELS: Record<Station, string> = {
  bar: 'Quầy Bar',
  kitchen: 'Bếp',
  all: 'Tổng quan',
}

const STATION_EMOJI: Record<Station, string> = {
  bar: '🧋',
  kitchen: '🍳',
  all: '📋',
}

const CONNECTION_LABELS: Record<string, { label: string; color: string }> = {
  connecting: { label: 'Đang kết nối…', color: 'bg-amber-400' },
  connected: { label: 'Đã kết nối', color: 'bg-emerald-400' },
  disconnected: { label: 'Mất kết nối', color: 'bg-slate-400' },
  error: { label: 'Lỗi kết nối', color: 'bg-red-400' },
}

// ─── StationView ────────────────────────────────────────────────────

export default function StationView({ station }: { station: Station }) {
  const { playChime, isMuted, toggleMute, needsUnlock, unlock } = useNotification()
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set())
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  // Callback for new order notification
  const handleNewOrder = useCallback((order: Order) => {
    if (!isMuted) {
      playChime()
    }
    setNewOrderIds((prev) => new Set(prev).add(order.id))

    // Clear highlight after 5 seconds
    const timer = setTimeout(() => {
      setNewOrderIds((prev) => {
        const next = new Set(prev)
        next.delete(order.id)
        return next
      })
      timersRef.current.delete(order.id)
    }, 5000)
    timersRef.current.set(order.id, timer)
  }, [isMuted, playChime])

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [])

  const { orders, connectionStatus, refetch } = useOrderStream(station, {
    onNewOrder: handleNewOrder,
  })

  const connConfig = CONNECTION_LABELS[connectionStatus] ?? CONNECTION_LABELS.disconnected

  // Filter out fully SERVED/CANCELLED orders for station views
  const activeOrders = orders.filter((o) => {
    const s = o.derivedStatus ?? o.status
    return s !== 'SERVED' && s !== 'CANCELLED'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50/50">
      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-amber-200/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl" role="img" aria-label={STATION_LABELS[station]}>
              {STATION_EMOJI[station]}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-amber-900 tracking-tight">
                {STATION_LABELS[station]}
              </h1>
              <p className="text-sm text-amber-600">
                {activeOrders.length > 0
                  ? `${activeOrders.length} đơn đang hoạt động`
                  : 'Không có đơn nào'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-amber-200/40">
              <span
                className={`w-2 h-2 rounded-full ${connConfig.color} ${
                  connectionStatus === 'connected' ? 'animate-pulse' : ''
                }`}
              />
              <span className="text-xs font-medium text-amber-700">
                {connConfig.label}
              </span>
            </div>

            {/* Unlock notification prompt */}
            {needsUnlock && (
              <button
                onClick={unlock}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-600 text-amber-50 font-semibold text-sm shadow-md shadow-amber-900/20 hover:bg-amber-700 transition-colors active:scale-95"
                style={{ transitionProperty: 'background-color, transform' }}
              >
                🔔 Bật thông báo
              </button>
            )}

            {/* Mute toggle */}
            {!needsUnlock && (
              <button
                onClick={toggleMute}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/60 border border-amber-200/40 text-amber-700 hover:bg-amber-100 transition-colors active:scale-95"
                style={{ transitionProperty: 'background-color, transform' }}
                title={isMuted ? 'Bỏ tắt tiếng' : 'Tắt tiếng'}
                aria-label={isMuted ? 'Bỏ tắt tiếng thông báo' : 'Tắt tiếng thông báo'}
              >
                <span className="text-xl" role="img" aria-hidden="true">
                  {isMuted ? '🔕' : '🔔'}
                </span>
              </button>
            )}

            {/* Refresh button */}
            <button
              onClick={refetch}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/60 border border-amber-200/40 text-amber-700 hover:bg-amber-100 transition-colors active:scale-95"
              title="Tải lại"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Content ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeOrders.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4 opacity-40">
              {STATION_EMOJI[station]}
            </div>
            <h2 className="text-xl font-semibold text-amber-800/60 mb-2">
              Chưa có đơn hàng mới
            </h2>
            <p className="text-amber-600/50 text-sm max-w-xs">
              Đơn hàng mới sẽ xuất hiện tự động khi khách đặt. Không cần tải lại trang.
            </p>
          </div>
        ) : (
          /* Order grid — responsive for tablet+ */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} isNew={newOrderIds.has(order.id)} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
