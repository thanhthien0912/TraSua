---
phase: complete-milestone
phase_name: M003 Structured Learnings
project: TraSua
generated: 2026-05-06T13:45:00Z
counts:
  decisions: 4
  lessons: 3
  patterns: 5
  surprises: 2
missing_artifacts: none
---

# M003: Staff Dashboard — Structured Learnings

### Decisions

- **Station-first vertical slice decomposition (D008):** Three slices ordered by risk — S01 proves SSE with the bar station end-to-end, S02 extends the proven StationView pattern to kitchen/overview + cancel, S03 adds purely additive polish. This de-risked SSE technology before investing in station expansion.
  Source: M003-ROADMAP.md/Slices

- **SSE subscriber registry on globalThis with station-level filtering (D009):** Single SSE endpoint at /api/staff/orders/stream with ?station= query param. Registry caches on globalThis for HMR safety. Broadcasts filter by station to reduce client noise.
  Source: M003-CONTEXT.md/Architectural Decisions

- **Shared StationView component parameterized by station type (D010):** All three stations share the same data shape, real-time mechanism, and card layout. Only filtering and available transitions differ. A single parameterized component avoids triplicate code and ensures change propagation.
  Source: M003-CONTEXT.md/Architectural Decisions

- **Cancel items only — R008 partial delivery:** M003 delivers item cancellation from dashboard. Adding items to existing orders deferred to M005. Customers use "Gọi thêm món" (new order for same table) as interim.
  Source: M003-CONTEXT.md/Cancel Items Only (R008 Partial)

### Lessons

- **Enriched SSE payloads eliminate client-side API roundtrips:** Including full menuItem details + table info in SSE events means station UIs can render and filter without additional GET calls. Design SSE events to be self-sufficient — enriching at broadcast time is cheaper than N client-side API roundtrips.
  Source: S01-SUMMARY.md/Key Architectural Decisions

- **StaffNav must be extracted as Client Component for usePathname while keeping layout as Server Component:** Next.js App Router requires careful server/client boundary management. The layout.tsx stays as Server Component for better performance; the navigation component that needs `usePathname()` is extracted into its own client component file.
  Source: S02-SUMMARY.md/Deviations

- **Windows compatibility for verification commands:** Unix-specific shell commands like `test -f` in verification scripts fail on Windows development environments. Cross-platform alternatives (or Node.js fs.existsSync checks) should be used in task plan verification steps.
  Source: S02-SUMMARY.md/Follow-ups

### Patterns

- **SSE subscriber registry on globalThis with dead subscriber cleanup:** Registry pattern at src/lib/sse.ts — addSubscriber/removeSubscriber/broadcast/getSubscriberCount. Dead subscribers auto-cleaned during broadcast iteration. Station-level metadata on each subscriber for filtered broadcast.
  Source: S01-SUMMARY.md/What This Slice Built

- **Order status auto-derivation from item statuses (computed, not stored):** deriveOrderStatus() computes on read and write as single source of truth. All PENDING→PENDING, any PREPARING→PREPARING, all non-cancelled READY→READY, all SERVED→SERVED, all CANCELLED→CANCELLED.
  Source: S01-SUMMARY.md/Key Architectural Decisions

- **Three-bucket order display with time-based auto-transitions:** categorizeOrders pure function splits orders into active/recentlyCompleted/hidden buckets. Injectable time parameters enable deterministic testing. 30-second bucketTick interval balances precision and performance.
  Source: S03-SUMMARY.md/What Happened

- **Ref-based callback stabilization for SSE hooks:** onNewOrderRef stores callback in a ref so useEffect dependency array doesn't include callback identity. Prevents SSE reconnection churn when parent re-renders with new callback reference.
  Source: S03-SUMMARY.md/Key decisions

- **Two-tap confirmation UX for destructive actions on touch interfaces:** First tap shows confirmation prompt ('Xác nhận huỷ?'), second tap executes. 3-second auto-reset timer via useEffect+useRef. Loading spinner prevents double-submission.
  Source: S02-SUMMARY.md/What Happened

### Surprises

- **SSE in Next.js 16 App Router worked smoothly with zero friction:** ReadableStream + text/event-stream headers worked out of the box. The globalThis subscriber registry pattern (matching Prisma singleton) survived HMR reloads. No connection lifecycle issues in dev mode despite initial risk assessment flagging this as high-risk.
  Source: S01-SUMMARY.md/What Happened

- **Stale .next/dev/types/ auto-generated files cause TypeScript errors when pages are added without the dev server running:** The files go stale and report type errors for new pages. Deleting .next/dev/types/ before running tsc --noEmit resolves it. This is a Windows development environment gotcha.
  Source: S02-SUMMARY.md/Verification
