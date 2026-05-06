---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T01: SSE subscriber registry + order status derivation

Create the SSE infrastructure and status derivation logic that all subsequent tasks depend on.

**Steps:**
1. Create `src/lib/sse.ts` — In-memory SSE subscriber registry using `globalThis` caching (same pattern as Prisma singleton). Export: `addSubscriber(controller, station?)`, `removeSubscriber(controller)`, `broadcast(event, data)` functions. The registry is a `Set<{controller: ReadableStreamDefaultController, station: string|null}>` so broadcasts can filter by station.
2. Create `src/lib/order-status.ts` — Pure function `deriveOrderStatus(itemStatuses: ItemStatus[]): OrderStatus` implementing derivation rules: all PENDING→PENDING, any PREPARING→PREPARING, all non-cancelled READY→READY, all non-cancelled SERVED→SERVED, all CANCELLED→CANCELLED. Also export `isValidTransition(from: ItemStatus, to: ItemStatus): boolean` for status transition validation (PENDING→PREPARING→READY→SERVED forward-only, plus any→CANCELLED).
3. Add unit tests for both: verify derivation rules with mixed status arrays, verify transition validation rejects backward moves.

## Inputs

- `prisma/schema.prisma — ItemStatus and OrderStatus enums`
- `src/lib/prisma.ts — globalThis caching pattern to replicate`

## Expected Output

- `src/lib/sse.ts`
- `src/lib/order-status.ts`

## Verification

Run unit tests for order-status derivation and transition validation. Verify sse.ts exports correct types and functions.
