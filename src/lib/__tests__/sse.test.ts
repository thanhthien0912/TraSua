import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  addSubscriber,
  removeSubscriber,
  broadcast,
  getSubscriberCount,
} from '../sse'
import type { SSESubscriber } from '../sse'

// Helper to create a mock ReadableStreamDefaultController
function createMockController(): ReadableStreamDefaultController & {
  _enqueued: Uint8Array[]
} {
  const enqueued: Uint8Array[] = []
  return {
    _enqueued: enqueued,
    desiredSize: 1,
    close: vi.fn(),
    enqueue: vi.fn((chunk: Uint8Array) => {
      enqueued.push(chunk)
    }),
    error: vi.fn(),
  }
}

// Reset registry between tests by clearing globalThis
beforeEach(() => {
  const g = globalThis as unknown as { __sseRegistry: unknown }
  delete g.__sseRegistry
})

describe('SSE Subscriber Registry', () => {
  describe('addSubscriber', () => {
    it('adds a subscriber with no station filter', () => {
      const ctrl = createMockController()
      const sub = addSubscriber(ctrl)
      expect(sub.controller).toBe(ctrl)
      expect(sub.station).toBeNull()
      expect(getSubscriberCount()).toBe(1)
    })

    it('adds a subscriber with a station filter', () => {
      const ctrl = createMockController()
      const sub = addSubscriber(ctrl, 'bar')
      expect(sub.station).toBe('bar')
      expect(getSubscriberCount()).toBe(1)
    })

    it('tracks multiple subscribers', () => {
      addSubscriber(createMockController(), 'bar')
      addSubscriber(createMockController(), 'kitchen')
      addSubscriber(createMockController())
      expect(getSubscriberCount()).toBe(3)
    })
  })

  describe('removeSubscriber', () => {
    it('removes a subscriber', () => {
      const ctrl = createMockController()
      const sub = addSubscriber(ctrl)
      expect(getSubscriberCount()).toBe(1)
      removeSubscriber(sub)
      expect(getSubscriberCount()).toBe(0)
    })

    it('only removes the specified subscriber', () => {
      const sub1 = addSubscriber(createMockController(), 'bar')
      const sub2 = addSubscriber(createMockController(), 'kitchen')
      removeSubscriber(sub1)
      expect(getSubscriberCount()).toBe(1)
    })

    it('is idempotent — removing twice does not error', () => {
      const sub = addSubscriber(createMockController())
      removeSubscriber(sub)
      removeSubscriber(sub) // Should not throw
      expect(getSubscriberCount()).toBe(0)
    })
  })

  describe('broadcast', () => {
    it('sends SSE-formatted data to all subscribers when no station filter', () => {
      const ctrl1 = createMockController()
      const ctrl2 = createMockController()
      addSubscriber(ctrl1)
      addSubscriber(ctrl2)

      broadcast('test-event', { id: 1, status: 'READY' })

      expect(ctrl1.enqueue).toHaveBeenCalledOnce()
      expect(ctrl2.enqueue).toHaveBeenCalledOnce()

      // Verify SSE format
      const decoder = new TextDecoder()
      const sent = decoder.decode(ctrl1._enqueued[0])
      expect(sent).toBe(
        'event: test-event\ndata: {"id":1,"status":"READY"}\n\n'
      )
    })

    it('filters by station — bar subscriber gets bar events only', () => {
      const barCtrl = createMockController()
      const kitchenCtrl = createMockController()
      addSubscriber(barCtrl, 'bar')
      addSubscriber(kitchenCtrl, 'kitchen')

      broadcast('item-update', { item: 'boba' }, 'bar')

      expect(barCtrl.enqueue).toHaveBeenCalledOnce()
      expect(kitchenCtrl.enqueue).not.toHaveBeenCalled()
    })

    it('subscribers with no station filter receive all events', () => {
      const allCtrl = createMockController()
      const barCtrl = createMockController()
      addSubscriber(allCtrl) // no filter
      addSubscriber(barCtrl, 'bar')

      broadcast('item-update', { item: 'pho' }, 'kitchen')

      expect(allCtrl.enqueue).toHaveBeenCalledOnce() // gets everything
      expect(barCtrl.enqueue).not.toHaveBeenCalled() // filtered out
    })

    it('broadcast with no station sends to everyone', () => {
      const barCtrl = createMockController()
      const kitchenCtrl = createMockController()
      addSubscriber(barCtrl, 'bar')
      addSubscriber(kitchenCtrl, 'kitchen')

      broadcast('order-created', { orderId: 5 })

      expect(barCtrl.enqueue).toHaveBeenCalledOnce()
      expect(kitchenCtrl.enqueue).toHaveBeenCalledOnce()
    })

    it('cleans up dead subscribers on broadcast', () => {
      const aliveCtrl = createMockController()
      const deadCtrl = createMockController()
      deadCtrl.enqueue = vi.fn(() => {
        throw new Error('Controller is closed')
      })

      addSubscriber(aliveCtrl)
      addSubscriber(deadCtrl)
      expect(getSubscriberCount()).toBe(2)

      broadcast('test', { ping: true })

      // Dead subscriber should be removed
      expect(getSubscriberCount()).toBe(1)
      expect(aliveCtrl.enqueue).toHaveBeenCalledOnce()
    })
  })
})
