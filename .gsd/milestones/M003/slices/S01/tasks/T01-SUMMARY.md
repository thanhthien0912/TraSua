---
id: T01
parent: S01
milestone: M003
key_files:
  - src/lib/sse.ts
  - src/lib/order-status.ts
  - src/lib/__tests__/order-status.test.ts
  - src/lib/__tests__/sse.test.ts
  - vitest.config.ts
  - package.json
key_decisions:
  - Installed Vitest as test runner (fast, native TypeScript, works with path aliases)
  - SSE registry uses globalThis.__sseRegistry (not globalThis.prisma pattern name but same caching approach)
  - Added getValidNextStatuses() utility beyond plan — enables UI to render available action buttons per item
  - Order status derivation treats PENDING+READY mix as PREPARING (items are in-progress even if some haven't started)
duration: 
verification_result: passed
completed_at: 2026-05-06T05:24:46.997Z
blocker_discovered: false
---

# T01: SSE subscriber registry with station-level filtering and order status derivation with forward-only transition validation

**SSE subscriber registry with station-level filtering and order status derivation with forward-only transition validation**

## What Happened

Created the two foundational libraries that all subsequent bar station tasks depend on.

**src/lib/sse.ts** — In-memory SSE subscriber registry cached on `globalThis.__sseRegistry` (same HMR-safe pattern as Prisma singleton). Exports `addSubscriber(controller, station?)`, `removeSubscriber(subscriber)`, `broadcast(event, data, station?)`, and `getSubscriberCount()`. The registry stores `Set<{controller, station}>` so broadcasts can filter by station — bar clients only receive bar events. Dead subscribers (closed controllers) are auto-cleaned during broadcast. All connection/disconnection/broadcast events are logged with `[SSE]` prefix for observability.

**src/lib/order-status.ts** — Pure function `deriveOrderStatus(itemStatuses[])` implements the derivation rules: all PENDING→PENDING, any active item past PENDING→PREPARING, all non-cancelled READY→READY, all non-cancelled SERVED→SERVED, all CANCELLED→CANCELLED. Also exports `isValidTransition(from, to)` enforcing forward-only transitions (PENDING→PREPARING→READY→SERVED plus any→CANCELLED), and `getValidNextStatuses(current)` for UI button rendering. Types are re-exported from generated Prisma enums for consumer convenience.

**Testing infrastructure** — Installed Vitest, configured `vitest.config.ts` with `@/` path alias, added `test` and `test:watch` npm scripts. Created comprehensive test suites: 43 tests for order-status (derivation with every status combination, forward/backward/skip/no-op transitions, terminal CANCELLED state) and 11 tests for SSE (subscriber lifecycle, station filtering, broadcast format, dead subscriber cleanup).

## Verification

All 54 unit tests pass. TypeScript compiles cleanly with zero errors (`npx tsc --noEmit --project tsconfig.json`).

Tests cover:
- deriveOrderStatus: empty array, single items, all-same statuses, mixed statuses with cancellations, complex multi-status scenarios
- isValidTransition: all valid forward transitions, all backward rejections, skip-forward rejections, no-op rejections, CANCELLED terminal state
- getValidNextStatuses: correct next states for each status
- SSE addSubscriber: with/without station, multiple subscribers
- SSE removeSubscriber: correct removal, idempotent double-remove
- SSE broadcast: SSE format correctness, station filtering, unfiltered subscribers get all events, dead subscriber cleanup

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run --reporter=verbose` | 0 | ✅ pass | 274ms |
| 2 | `npx tsc --noEmit --project tsconfig.json` | 0 | ✅ pass | 5000ms |

## Deviations

Added `getValidNextStatuses()` helper not in original plan — a natural companion to `isValidTransition()` that downstream UI tasks will need for rendering action buttons. Also added `getSubscriberCount()` to SSE module for health check / debugging use.

## Known Issues

None.

## Files Created/Modified

- `src/lib/sse.ts`
- `src/lib/order-status.ts`
- `src/lib/__tests__/order-status.test.ts`
- `src/lib/__tests__/sse.test.ts`
- `vitest.config.ts`
- `package.json`
