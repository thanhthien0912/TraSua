'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useOrderStream, type Station, type Order } from './useOrderStream'
import { useNotification } from './useNotification'
import { categorizeOrders } from '@/lib/categorize-orders'
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

const COMPLETED_STATUSES = new Set(['SERVED', 'CANCELLED'])
const HIDE_AFTER_MS = 5 * 60 * 1000 // 5 minutes
const BUCKET_INTERVAL_MS = 30_000     // re-evaluate every 30s
const DISCONNECT_DEBOUNCE_MS = 3_000  // show banner after 3s of error
const RECONNECT_BANNER_MS = 2_000     // green banner visible for 2s

// ─── StationView ────────────────────────────────────────────────────

export default function StationView({ station }: { station: Station }) {
  const { playChime, isMuted, toggleMute, needsUnlock, unlock } = useNotification()
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set())
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  // ─── Completed-at tracking ──────────────────────────────────
  const completedAtRef = useRef<Map<number, number>>(new Map())
  const [bucketTick, setBucketTick] = useState(0)

  // ─── Disconnection banner state ──────────────────────────────
  const [showDisconnectBanner, setShowDisconnectBanner] = useState(false)
  const [showReconnectBanner, setShowReconnectBanner] = useState(false)
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasDisconnectedRef = useRef(false)

  // ─── Lịch sử toggle ─────────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false)

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

  // Cleanup highlight timers on unmount
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

  // ─── Track when orders first become completed ────────────────
  useEffect(() => {
    const map = completedAtRef.current
    const now = Date.now()
    for (const order of orders) {
      const status = order.derivedStatus ?? order.status
      if (COMPLETED_STATUSES.has(status) && !map.has(order.id)) {
        map.set(order.id, now)
      }
      // If an order reverts to active (shouldn't normally happen), clean up
      if (!COMPLETED_STATUSES.has(status) && map.has(order.id)) {
        map.delete(order.id)
      }
    }
  }, [orders])

  // ─── 30-second interval to re-evaluate time-based buckets ────
  useEffect(() => {
    const interval = setInterval(() => {
      setBucketTick((t) => t + 1)
    }, BUCKET_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  // ─── Categorize orders into buckets ──────────────────────────
  const { active, recentlyCompleted, hidden } = useMemo(
    () => categorizeOrders(orders, completedAtRef.current, Date.now(), HIDE_AFTER_MS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders, bucketTick]
  )

  // ─── Disconnection banner logic ──────────────────────────────
  useEffect(() => {
    const isErrorState = connectionStatus === 'error' || connectionStatus === 'disconnected'

    if (isErrorState) {
      // Start debounce timer — show banner only after 3s of continuous error
      if (!disconnectTimerRef.current) {
        disconnectTimerRef.current = setTimeout(() => {
          setShowDisconnectBanner(true)
          wasDisconnectedRef.current = true
          console.log('[StationView] Disconnection banner shown')
        }, DISCONNECT_DEBOUNCE_MS)
      }
    } else {
      // Connection restored — cancel pending debounce
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current)
        disconnectTimerRef.current = null
      }
      setShowDisconnectBanner(false)

      // Show reconnection success banner if we were disconnected
      if (wasDisconnectedRef.current && connectionStatus === 'connected') {
        wasDisconnectedRef.current = false
        setShowReconnectBanner(true)
        console.log('[StationView] Reconnection banner shown')
        reconnectTimerRef.current = setTimeout(() => {
          setShowReconnectBanner(false)
          console.log('[StationView] Reconnection banner hidden')
        }, RECONNECT_BANNER_MS)
      }
    }

    return () => {
      // Cleanup only on unmount (not on every status change)
    }
  }, [connectionStatus])

  // Cleanup all disconnect/reconnect timers on unmount
  useEffect(() => {
    return () => {
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    }
  }, [])

  const connConfig = CONNECTION_LABELS[connectionStatus] ?? CONNECTION_LABELS.disconnected

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
                {active.length > 0
                  ? `${active.length} đơn đang hoạt động`
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

            {/* Lịch sử toggle button */}
            {hidden.length > 0 && (
              <button
                onClick={() => setShowHistory((v) => !v)}
                className={`min-h-[44px] px-4 py-2 rounded-xl font-semibold text-sm transition-colors active:scale-95 ${
                  showHistory
                    ? 'bg-amber-700 text-amber-50 shadow-md shadow-amber-900/20'
                    : 'bg-white/60 border border-amber-200/40 text-amber-700 hover:bg-amber-100'
                }`}
                style={{ transitionProperty: 'background-color, transform' }}
                aria-label={showHistory ? 'Ẩn lịch sử đơn hàng' : 'Hiện lịch sử đơn hàng'}
              >
                Lịch sử ({hidden.length})
              </button>
            )}

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

      {/* ─── Disconnection Banner ───────────────────────────── */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showDisconnectBanner ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span role="img" aria-hidden="true">⚠️</span>
              <span className="text-sm font-medium text-red-800">
                Mất kết nối — Đang kết nối lại...
              </span>
            </div>
            <button
              onClick={refetch}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors active:scale-95"
              style={{ transitionProperty: 'background-color, transform' }}
            >
              Tải lại
            </button>
          </div>
        </div>
      </div>

      {/* ─── Reconnection Success Banner ────────────────────── */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showReconnectBanner ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span role="img" aria-hidden="true">✅</span>
            <span className="text-sm font-medium text-emerald-800">
              Đã kết nối lại
            </span>
          </div>
        </div>
      </div>

      {/* ─── Content ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {active.length === 0 && recentlyCompleted.length === 0 && (!showHistory || hidden.length === 0) ? (
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
          <>
            {/* Active orders grid */}
            {active.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {active.map((order) => (
                  <OrderCard key={order.id} order={order} isNew={newOrderIds.has(order.id)} />
                ))}
              </div>
            )}

            {/* Recently completed orders (greyed out) */}
            {recentlyCompleted.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-amber-600/60 uppercase tracking-wider mb-3">
                  Đã xong
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 completed-orders-section">
                  {recentlyCompleted.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}

            {/* Hidden (history) orders — shown when Lịch sử toggle is on */}
            {showHistory && hidden.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-amber-600/60 uppercase tracking-wider mb-3">
                  Lịch sử
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 completed-orders-section">
                  {hidden.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
