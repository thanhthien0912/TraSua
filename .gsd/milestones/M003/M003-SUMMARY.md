---
id: M003
title: "Staff Dashboard"
status: complete
completed_at: 2026-05-06T06:47:20.248Z
key_decisions:
  - D008: Station-first vertical slice decomposition (S01 bar proves SSE, S02 extends, S03 polishes) — validated as correct risk ordering
  - D009: SSE subscriber registry with globalThis caching and station-level filtering — proven reliable across multiple concurrent stations
  - D010: Shared StationView component parameterized by station type — all three stations use identical component with just a station prop change
  - SSE broadcasts to ALL stations without server-side filter — client-side hook does filtering, simpler and ensures status updates propagate correctly
  - Order status derived (computed) not stored — deriveOrderStatus() as single source of truth
  - Bottom navigation over top tabs for staff layout — better tablet/thumb ergonomics
  - Web Audio API OscillatorNode for notification chimes — zero external deps, works offline
  - categorizeOrders as injectable pure function for three-bucket order display — enables deterministic testing
  - Two-tap cancel confirmation with 3-second auto-reset — prevents accidental destructive actions
key_files:
  - src/lib/sse.ts
  - src/lib/order-status.ts
  - src/lib/categorize-orders.ts
  - src/app/api/staff/orders/stream/route.ts
  - src/app/api/staff/orders/route.ts
  - src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts
  - src/components/staff/StationView.tsx
  - src/components/staff/OrderCard.tsx
  - src/components/staff/useOrderStream.ts
  - src/components/staff/useNotification.ts
  - src/app/staff/bar/page.tsx
  - src/app/staff/kitchen/page.tsx
  - src/app/staff/page.tsx
  - src/app/staff/layout.tsx
  - src/app/staff/StaffNav.tsx
  - vitest.config.ts
lessons_learned:
  - SSE in Next.js App Router works well via ReadableStream + text/event-stream — the globalThis singleton pattern for subscriber registry mirrors the established Prisma caching approach and survives HMR
  - Station-first vertical slice decomposition de-risked SSE technology in S01 before extending patterns in S02/S03 — high-risk slice first is the correct ordering
  - Enriched SSE payloads (including full menuItem details + table info) eliminate client-side API roundtrips — design SSE events to be self-sufficient
  - Ref-based callback stabilization prevents useEffect re-runs when callback identity changes — critical for SSE hooks that must not reconnect on every render
  - Pure function extraction with injectable time sources (categorizeOrders) enables deterministic testing of time-dependent behavior
  - StaffNav must be extracted as Client Component to use usePathname while keeping layout as Server Component — Next.js pattern for mixing server/client
  - Two-tap confirmation with auto-reset timer is a good UX pattern for destructive actions on touch interfaces
  - Windows development environment needs cross-platform alternatives to Unix shell commands (test -f) in verification scripts
---

# M003: Staff Dashboard

**Delivered a real-time three-station staff dashboard (bar, kitchen, overview) with SSE-driven order streaming, one-tap status transitions, item cancellation with totalAmount recalculation, notification chimes, auto-hide completed orders, and disconnection resilience — completing the critical link between customer QR ordering and physical preparation workflow.**

## What Happened

## What Was Built

M003 delivered the Staff Dashboard — the real-time order management system that connects customer orders (M002) to physical preparation workflow at bar, kitchen, and runner stations. Three vertical slices were executed in risk order:

### S01: Bar Station End-to-End (SSE + API + UI) — Risk: High
The highest-risk slice proved SSE works in Next.js 16 App Router and shipped the complete bar station. Created foundational infrastructure:
- **SSE subscriber registry** (`src/lib/sse.ts`) — globalThis-cached singleton with station-level filtering, dead subscriber cleanup, broadcast to all connected clients
- **Order status derivation** (`src/lib/order-status.ts`) — pure functions to derive order status from item statuses, validate forward-only transitions, compute valid next states
- **Staff API endpoints** — GET /api/staff/orders (station-filtered), SSE stream, PATCH item status with 409 on invalid transitions
- **StationView + OrderCard** — reusable component architecture for all three stations
- **useOrderStream hook** — initial snapshot + incremental SSE updates with client-side category filtering
- **54 unit tests** for order-status derivation and SSE registry lifecycle

### S02: Kitchen + Overview + Cancel — Risk: Medium
Extended proven S01 patterns to complete the three-station topology:
- Kitchen page at `/staff/kitchen` (FOOD items only) and overview at `/staff` (all orders with SERVED transitions)
- Staff layout with bottom navigation connecting three stations (StaffNav extracted as Client Component)
- Item cancellation with two-tap confirmation, `calculateOrderTotal` helper for server-side total recalculation, SSE broadcast of updated totals
- 8 unit tests for cancel/recalculation edge cases

### S03: Notifications & Auto-Hide Polish — Risk: Low
Additive polish layer completing the real-time experience:
- Web Audio API notification chime (OscillatorNode, zero external deps) with localStorage mute persistence and autoplay unlock
- Three-bucket order display (active → recentlyCompleted → hidden) with 5-minute auto-hide and Lịch sử toggle
- SSE disconnection/reconnection banners with 3-second debounce
- 9 unit tests for categorizeOrders boundary conditions

### Cross-Slice Integration
All three slices integrated cleanly. S01's StationView + useOrderStream were directly reused by S02's kitchen/overview pages with zero modifications to the core pattern — just `station="kitchen"` and `station="all"` props. S03's notification and auto-hide features were layered onto StationView and useOrderStream via hooks and pure functions, with ref-based callback stabilization preventing SSE reconnection churn.

The total delivery: 21 source files changed, 2201 lines of production code added, 71 unit tests passing across 4 test files. All Vietnamese UI text. Tablet/desktop optimized with 44px+ touch targets.

## Success Criteria Results

### Success Criteria Results

- ✅ **Customer submits order with drink+food items → bar station shows only drink items within 3 seconds via SSE, kitchen station shows only food items within 3 seconds**
  - GET /api/staff/orders?station=bar filters DRINK items; station=kitchen filters FOOD items. SSE stream at /api/staff/orders/stream delivers new-order events. POST /api/order broadcasts to all connected stations. useOrderStream hook applies client-side category filtering. Verified via curl API tests and dev server end-to-end testing.

- ✅ **Bar staff taps items through PREPARING → READY, kitchen does the same → overview shows order status auto-derived as READY → runner marks SERVED**
  - PATCH /api/staff/orders/[orderId]/items/[itemId] validates forward-only transitions (409 on invalid). deriveOrderStatus() computes order-level status from item statuses. Overview page with station="all" shows SERVED transition button for READY orders. 54 unit tests cover all derivation rules and transition validations.

- ✅ **Staff cancels an item → item shows CANCELLED, order totalAmount is recalculated server-side, SSE broadcasts the change to all connected stations**
  - PATCH endpoint with {action:'cancel'} sets ItemStatus.CANCELLED, calculateOrderTotal recomputes from non-cancelled items, SSE broadcasts updated order with new totalAmount. Two-tap cancel confirmation in OrderCard UI. 8 dedicated cancel-recalculation unit tests.

- ✅ **Multiple station pages can be open simultaneously without SSE connection conflicts**
  - SSE subscriber registry on globalThis supports multiple concurrent subscribers (Map-based). Each station page registers independently. Broadcast iterates all subscribers. Dead subscriber cleanup on failed writes.

- ✅ **All UI text is Vietnamese, layout is tablet/desktop optimized**
  - Station labels: Quầy Bar, Bếp, Tổng quan. Status labels in Vietnamese. Bottom navigation with 44px+ touch targets. Responsive layout for tablet/desktop.

## Definition of Done Results

### Definition of Done Results

- ✅ **All 3 slices complete** — S01 (complete), S02 (complete), S03 (complete). All 9 tasks (4+3+2) marked done.
- ✅ **All slice summaries exist** — S01-SUMMARY.md, S02-SUMMARY.md, S03-SUMMARY.md all present with verification_result: passed.
- ✅ **Cross-slice integration verified** — S01 infrastructure reused directly by S02 and S03. StationView, OrderCard, useOrderStream, SSE registry all compose correctly across station pages.
- ✅ **71 unit tests passing** — 4 test files: order-status (43 tests), sse (11 tests), cancel-recalculation (8 tests), categorize-orders (9 tests).
- ✅ **TypeScript compiles cleanly** — `npx tsc --noEmit` exit 0.
- ✅ **All key implementation files present** — 21 non-.gsd files changed, 2201 lines added.
- ✅ **Horizontal checklist items addressed** — Requirements re-read, decisions re-evaluated, auth boundary respected, shared resources documented, reconnection handled, schema migrations confirmed unnecessary.

## Requirement Outcomes

### Requirement Status Transitions

- **R001** (active → validated): "Khách hàng quét QR, chọn món, gửi đơn — nhân viên nhận được đơn ngay." M002 delivered customer QR→order flow. M003 delivered staff real-time SSE dashboard. Full loop proven: customer scans QR → places order → staff sees it within 3 seconds on bar/kitchen/overview station.

- **R002** (active → validated): "Đơn hàng tự động chia ra: đồ uống → quầy bar, đồ ăn → bếp." GET /api/staff/orders?station=bar returns only DRINK items; station=kitchen returns only FOOD items. StationView filters by category. Three station pages confirmed working.

- **R003** (active → validated): "Bảng điều khiển nhân viên hiển thị đơn hàng realtime, cập nhật trạng thái < 3 giây." SSE stream delivers events within 3 seconds. Staff advance statuses with single taps. Notification chimes on new orders. Auto-hide completed items after 5 minutes. Disconnection banner on SSE drop. 71 tests pass.

- **R008** (active → active, partially advanced): "Nhân viên có thể huỷ món hoặc thêm món khác cho đơn hàng từ dashboard." Cancel: ✅ Delivered — two-tap confirmation, totalAmount recalculated, SSE broadcasts. Add item: ❌ Deferred to M005 per planning decision (customers use 'Gọi thêm món' as interim).

## Deviations

Minor additive deviations only — no plan items removed or reduced:
- Added getValidNextStatuses() utility beyond plan (enables UI action buttons)
- Added getSubscriberCount() to SSE module for debugging
- Added derivedStatus field to GET orders response (needed for accurate UI display)
- Enriched POST /api/order response with table info and full menuItem fields for SSE consumer needs
- StaffNav extracted as separate Client Component file (kept layout as Server Component — better Next.js practice)
- OrderCard transition-all changed to transition-shadow per design guidelines
- Added -webkit-font-smoothing: antialiased to globals.css (standard polish)

## Follow-ups

- R008 'add item to existing order' capability needs a future slice (likely M005 menu management scope)
- No load testing — SSE verified with single-digit concurrent connections only
- No cross-browser testing performed
- 30-second bucket tick granularity for auto-hide could be tightened if needed
- Cross-tab notification deduplication not implemented (each tab plays its own chime)
- Audio chime is a simple sine-wave oscillator — could be upgraded to a more pleasant sound file
