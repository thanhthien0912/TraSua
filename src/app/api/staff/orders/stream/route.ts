import { NextRequest } from 'next/server'
import { addSubscriber, removeSubscriber } from '@/lib/sse'

/**
 * GET /api/staff/orders/stream
 *
 * Server-Sent Events endpoint for real-time order updates.
 * Accepts ?station=bar|kitchen to filter events by station.
 * Clients without a station param receive all events.
 */
export async function GET(request: NextRequest) {
  const station = request.nextUrl.searchParams.get('station')

  console.log(
    `[SSE /api/staff/orders/stream] New connection (station=${station ?? 'all'})`
  )

  const stream = new ReadableStream({
    start(controller) {
      // Register this connection in the subscriber registry
      const subscriber = addSubscriber(controller, station)

      // Send an initial heartbeat comment to confirm the connection is open
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(':heartbeat\n\n'))

      // Clean up on client disconnect (AbortSignal from the request)
      request.signal.addEventListener('abort', () => {
        console.log(
          `[SSE /api/staff/orders/stream] Client disconnected (station=${station ?? 'all'})`
        )
        removeSubscriber(subscriber)
        try {
          controller.close()
        } catch {
          // Controller may already be closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
