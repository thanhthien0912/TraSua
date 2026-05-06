---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T02: SSE stream endpoint + GET orders endpoint

Create the two read-path API endpoints that the bar station UI will consume.

**Steps:**
1. Create `src/app/api/staff/orders/stream/route.ts` — GET Route Handler returning `text/event-stream` response with a `ReadableStream`. On start, the controller is added to the subscriber registry with the `station` query param. Listen for `request.signal` abort to remove the controller on disconnect. Send an initial `:heartbeat` comment line. Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
2. Create `src/app/api/staff/orders/route.ts` — GET Route Handler returning active orders (non-SERVED, non-CANCELLED at order level). Accept `?station=bar|kitchen|all` query param. When station=bar, include only OrderItems where menuItem.category=DRINK. When station=kitchen, only FOOD. Include order.table, order.items with menuItem details. Return JSON array sorted by createdAt desc.
3. Test with curl: `curl -N localhost:3000/api/staff/orders/stream` should hang open. `curl localhost:3000/api/staff/orders?station=bar` should return filtered orders (seed data).

## Inputs

- `src/lib/sse.ts — subscriber registry`
- `src/lib/prisma.ts — PrismaClient`
- `prisma/schema.prisma — Order/OrderItem/MenuItem relations`

## Expected Output

- `src/app/api/staff/orders/stream/route.ts`
- `src/app/api/staff/orders/route.ts`

## Verification

curl -N http://localhost:3000/api/staff/orders/stream returns text/event-stream that stays open. curl http://localhost:3000/api/staff/orders?station=bar returns JSON with only DRINK items. Dev server starts without errors.
