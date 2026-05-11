'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useOrderStream, type Station, type Order } from './useOrderStream'
import { useNotification } from './useNotification'
import { categorizeOrders } from '@/lib/categorize-orders'
import OrderCard from './OrderCard'

const STATION_LABELS: Record<Station, string> = {
  bar: 'Nước',
  kitchen: 'Đồ ăn',
  all: 'Tổng quan',
}
const STATION_EMOJI: Record<Station, string> = {
  bar: '🧋',
  kitchen: '🍳',
  all: '📋',
}

const COMPLETED_STATUSES = new Set(['SERVED', 'CANCELLED'])
const HIDE_AFTER_MS = 5 * 60 * 1000
const BUCKET_INTERVAL_MS = 30_000
const DISCONNECT_DEBOUNCE_MS = 3_000
const RECONNECT_BANNER_MS = 2_000

export default function StationView({ station }: { station: Station }) {
  const { playChime, isMuted, toggleMute, needsUnlock, unlock } = useNotification()
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set())
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const completedAtRef = useRef<Map<number, number>>(new Map())
  const [bucketTick, setBucketTick] = useState(0)
  const [showDisconnectBanner, setShowDisconnectBanner] = useState(false)
  const [showReconnectBanner, setShowReconnectBanner] = useState(false)
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasDisconnectedRef = useRef(false)

  const handleNewOrder = useCallback((order: Order) => {
    if (!isMuted) playChime()
    setNewOrderIds((prev) => new Set(prev).add(order.id))
    const timer = setTimeout(() => {
      setNewOrderIds((prev) => { const next = new Set(prev); next.delete(order.id); return next })
      timersRef.current.delete(order.id)
    }, 5000)
    timersRef.current.set(order.id, timer)
  }, [isMuted, playChime])

  useEffect(() => {
    const timers = timersRef.current
    return () => { timers.forEach((t) => clearTimeout(t)); timers.clear() }
  }, [])

  const { orders, connectionStatus, refetch } = useOrderStream(station, { onNewOrder: handleNewOrder })

  useEffect(() => {
    const map = completedAtRef.current
    const now = Date.now()
    for (const order of orders) {
      const status = order.derivedStatus ?? order.status
      if (COMPLETED_STATUSES.has(status) && !map.has(order.id)) map.set(order.id, now)
      if (!COMPLETED_STATUSES.has(status) && map.has(order.id)) map.delete(order.id)
    }
  }, [orders])

  useEffect(() => {
    const interval = setInterval(() => setBucketTick((t) => t + 1), BUCKET_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const { active, recentlyCompleted, hidden } = useMemo(
    () => categorizeOrders(orders, completedAtRef.current, Date.now(), HIDE_AFTER_MS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders, bucketTick]
  )

  useEffect(() => {
    const isError = connectionStatus === 'error' || connectionStatus === 'disconnected'
    if (isError) {
      if (!disconnectTimerRef.current) {
        disconnectTimerRef.current = setTimeout(() => {
          setShowDisconnectBanner(true)
          wasDisconnectedRef.current = true
        }, DISCONNECT_DEBOUNCE_MS)
      }
    } else {
      if (disconnectTimerRef.current) { clearTimeout(disconnectTimerRef.current); disconnectTimerRef.current = null }
      setShowDisconnectBanner(false)
      if (wasDisconnectedRef.current && connectionStatus === 'connected') {
        wasDisconnectedRef.current = false
        setShowReconnectBanner(true)
        reconnectTimerRef.current = setTimeout(() => setShowReconnectBanner(false), RECONNECT_BANNER_MS)
      }
    }
  }, [connectionStatus])

  useEffect(() => () => {
    if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current)
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
  }, [])

  const isConnected = connectionStatus === 'connected'

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white border-b border-border shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{STATION_EMOJI[station]}</span>
            <div>
              <h1 className="text-xl font-black text-foreground">{STATION_LABELS[station]}</h1>
              <p className="text-xs font-bold text-foreground/40 mt-0.5">
                {active.length > 0 ? `${active.length} đơn đang hoạt động` : 'Không có đơn nào'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection dot */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-white">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-[10px] font-black uppercase text-foreground/50">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Unlock / Mute */}
            {needsUnlock ? (
              <button onClick={unlock} className="min-h-[40px] px-3 py-2 rounded-xl bg-primary text-white font-black text-xs uppercase active:scale-95">
                🔔 Bật âm
              </button>
            ) : (
              <button onClick={toggleMute} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border active:scale-95 text-lg">
                {isMuted ? '🔕' : '🔔'}
              </button>
            )}

            {/* Refresh */}
            <button onClick={refetch} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border active:scale-95 text-foreground/50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Disconnect Banner ─────────────────────────────── */}
      <div className={`overflow-hidden transition-all duration-300 ${showDisconnectBanner ? 'max-h-20' : 'max-h-0'}`}>
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-black text-red-700">⚠️ Mất kết nối — Đang thử lại...</span>
          <button onClick={refetch} className="min-h-[40px] px-4 rounded-xl bg-red-600 text-white font-black text-xs uppercase active:scale-95">Tải lại</button>
        </div>
      </div>

      {/* ── Reconnect Banner ──────────────────────────────── */}
      <div className={`overflow-hidden transition-all duration-300 ${showReconnectBanner ? 'max-h-16' : 'max-h-0'}`}>
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <span className="text-sm font-black text-green-700">✅ Đã kết nối lại</span>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <main className="px-4 py-5 pb-24 max-w-7xl mx-auto">
        {active.length === 0 && recentlyCompleted.length === 0 && hidden.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4 opacity-20">{STATION_EMOJI[station]}</div>
            <h2 className="text-lg font-black text-foreground/40 mb-2">Chưa có đơn hàng mới</h2>
            <p className="text-sm font-bold text-foreground/30 max-w-xs">Đơn hàng mới sẽ xuất hiện tự động khi khách đặt.</p>
          </div>
        ) : (
          <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 140px)' }}>

            {/* ── Vùng trên 2/3: Đơn đang làm ──────────────── */}
            <div style={{ flex: '0 0 66.666%' }} className="overflow-y-auto pb-4">
              {active.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="text-5xl mb-3 opacity-20">{STATION_EMOJI[station]}</div>
                  <p className="text-sm font-black text-foreground/30">Không có đơn đang chờ</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {active.map((order) => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      isNew={newOrderIds.has(order.id)} 
                      showPrice={station === 'all'} 
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Đường kẻ phân chia ────────────────────────── */}
            <div className="flex items-center gap-3 my-2 sticky top-0 z-10 bg-background py-2">
              <div className="flex-1 h-[2px] bg-border" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30 whitespace-nowrap px-2 py-1 bg-secondary rounded-full">
                ✅ Đã xong ({recentlyCompleted.length + hidden.length})
              </span>
              <div className="flex-1 h-[2px] bg-border" />
            </div>

            {/* ── Vùng dưới 1/3: Đã xong ────────────────────── */}
            <div style={{ flex: '0 0 33.333%' }} className="overflow-y-auto pt-2">
              {recentlyCompleted.length === 0 && hidden.length === 0 ? (
                <p className="text-center text-xs font-black text-foreground/20 py-6">Chưa có món nào hoàn thành</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {/* Recently completed — mờ nhẹ */}
                  {recentlyCompleted.map((order) => (
                    <OrderCard key={order.id} order={order} dimmed showPrice={station === 'all'} />
                  ))}
                  {/* Hidden (> 5 phút) — mờ hơn */}
                  {hidden.map((order) => (
                    <OrderCard key={order.id} order={order} dimmed faded showPrice={station === 'all'} />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
