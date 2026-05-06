/**
 * SSE Subscriber Registry
 *
 * In-memory registry of SSE connections, cached on globalThis to survive
 * Next.js HMR reloads (same pattern as Prisma singleton in src/lib/prisma.ts).
 *
 * Subscribers can be filtered by station (bar/kitchen) so broadcasts only
 * reach relevant clients.
 */

export interface SSESubscriber {
  controller: ReadableStreamDefaultController
  station: string | null
}

interface SSERegistry {
  subscribers: Set<SSESubscriber>
}

const globalForSSE = globalThis as unknown as { __sseRegistry: SSERegistry }

function getRegistry(): SSERegistry {
  if (!globalForSSE.__sseRegistry) {
    globalForSSE.__sseRegistry = { subscribers: new Set() }
    console.log('[SSE] Registry initialized')
  }
  return globalForSSE.__sseRegistry
}

/**
 * Register a new SSE subscriber.
 * @param controller - ReadableStream controller to write SSE events to
 * @param station - Optional station filter ('bar', 'kitchen', or null for all)
 * @returns The subscriber object (for later removal)
 */
export function addSubscriber(
  controller: ReadableStreamDefaultController,
  station: string | null = null
): SSESubscriber {
  const registry = getRegistry()
  const subscriber: SSESubscriber = { controller, station }
  registry.subscribers.add(subscriber)
  console.log(
    `[SSE] Subscriber connected (station=${station ?? 'all'}, total=${registry.subscribers.size})`
  )
  return subscriber
}

/**
 * Remove a subscriber from the registry.
 * Call this when the client disconnects.
 */
export function removeSubscriber(subscriber: SSESubscriber): void {
  const registry = getRegistry()
  registry.subscribers.delete(subscriber)
  console.log(
    `[SSE] Subscriber disconnected (station=${subscriber.station ?? 'all'}, total=${registry.subscribers.size})`
  )
}

/**
 * Broadcast an SSE event to all matching subscribers.
 * @param event - SSE event name (e.g. 'order-update', 'item-status-change')
 * @param data - JSON-serializable payload
 * @param station - If set, only send to subscribers matching this station (or those with no station filter)
 */
export function broadcast(
  event: string,
  data: unknown,
  station?: string | null
): void {
  const registry = getRegistry()
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  const encoder = new TextEncoder()
  const encoded = encoder.encode(payload)

  let sent = 0
  const toRemove: SSESubscriber[] = []

  for (const subscriber of registry.subscribers) {
    // Filter: if station is specified, only send to subscribers with matching station or no filter
    if (station && subscriber.station && subscriber.station !== station) {
      continue
    }

    try {
      subscriber.controller.enqueue(encoded)
      sent++
    } catch {
      // Controller is closed or errored — mark for cleanup
      toRemove.push(subscriber)
    }
  }

  // Clean up dead connections
  for (const dead of toRemove) {
    registry.subscribers.delete(dead)
    console.log(
      `[SSE] Removed dead subscriber (station=${dead.station ?? 'all'})`
    )
  }

  console.log(
    `[SSE] Broadcast event="${event}" station=${station ?? 'all'} sent=${sent} cleaned=${toRemove.length}`
  )
}

/**
 * Get the current subscriber count. Useful for health checks and debugging.
 */
export function getSubscriberCount(): number {
  return getRegistry().subscribers.size
}
