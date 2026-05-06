'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

// ─── Constants ──────────────────────────────────────────────────────

const MUTE_KEY = 'staff-notification-mute'
const PREFIX = '[useNotification]'

// Two-tone chime frequencies: A5 → C#6 (pleasant ascending interval)
const TONE_1_FREQ = 880   // A5
const TONE_2_FREQ = 1108.7 // C#6
const TONE_DURATION = 0.15  // each tone ~150ms, total ~300ms

// ─── Hook ───────────────────────────────────────────────────────────

export function useNotification() {
  const [isMuted, setIsMuted] = useState(false)
  const [needsUnlock, setNeedsUnlock] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Initialize: read mute from localStorage, create AudioContext
  useEffect(() => {
    // Read persisted mute state
    try {
      const stored = localStorage.getItem(MUTE_KEY)
      if (stored === 'true') {
        setIsMuted(true)
        console.log(`${PREFIX} Muted (restored from localStorage)`)
      }
    } catch {
      // localStorage unavailable — ignore
    }

    // Create AudioContext and check autoplay policy
    try {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx

      if (ctx.state === 'suspended') {
        setNeedsUnlock(true)
        console.log(`${PREFIX} AudioContext suspended — needs user gesture to unlock`)
      } else {
        console.log(`${PREFIX} AudioContext ready (state: ${ctx.state})`)
      }
    } catch (err) {
      console.error(`${PREFIX} Failed to create AudioContext:`, err)
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
      }
    }
  }, [])

  // Unlock AudioContext (must be called inside a user gesture handler)
  const unlock = useCallback(async () => {
    const ctx = audioCtxRef.current
    if (!ctx) return

    try {
      await ctx.resume()
      setNeedsUnlock(false)
      console.log(`${PREFIX} AudioContext unlocked`)
    } catch (err) {
      console.error(`${PREFIX} Failed to unlock AudioContext:`, err)
    }
  }, [])

  // Toggle mute and persist
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem(MUTE_KEY, String(next))
      } catch {
        // localStorage unavailable — ignore
      }
      console.log(`${PREFIX} ${next ? 'Muted' : 'Unmuted'}`)
      return next
    })
  }, [])

  // Play a two-tone chime via Web Audio API oscillators
  const playChime = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx || ctx.state !== 'running') {
      console.log(`${PREFIX} Cannot play — AudioContext not ready (state: ${ctx?.state ?? 'null'})`)
      return
    }

    const now = ctx.currentTime
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.3, now)
    masterGain.gain.linearRampToValueAtTime(0, now + TONE_DURATION * 2 + 0.05)
    masterGain.connect(ctx.destination)

    // Tone 1: A5
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(TONE_1_FREQ, now)
    gain1.gain.setValueAtTime(0.4, now)
    gain1.gain.linearRampToValueAtTime(0, now + TONE_DURATION)
    osc1.connect(gain1)
    gain1.connect(masterGain)
    osc1.start(now)
    osc1.stop(now + TONE_DURATION)

    // Tone 2: C#6 (starts after tone 1)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(TONE_2_FREQ, now + TONE_DURATION)
    gain2.gain.setValueAtTime(0, now)
    gain2.gain.setValueAtTime(0.4, now + TONE_DURATION)
    gain2.gain.linearRampToValueAtTime(0, now + TONE_DURATION * 2)
    osc2.connect(gain2)
    gain2.connect(masterGain)
    osc2.start(now + TONE_DURATION)
    osc2.stop(now + TONE_DURATION * 2 + 0.05)

    console.log(`${PREFIX} Chime played`)
  }, [])

  return { playChime, isMuted, toggleMute, needsUnlock, unlock }
}
