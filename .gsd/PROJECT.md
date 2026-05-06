# TraSua — Hệ Thống Quản Lý Quán Trà Sữa

## What It Is

A local-network POS and order management system for a mid-range bubble tea shop. Customers scan pre-printed QR codes at their table to browse the menu and place orders from their phone. Staff receive orders in real-time on a dashboard, with automatic routing to bar (drinks) and kitchen (food) stations.

## Current State

**Phase:** M003 complete — all three slices delivered. Staff Dashboard fully functional with real-time SSE, station routing, item cancellation, notifications, and auto-hide polish. Next: M004 (Bill & Checkout).

**What exists:**
- Next.js 16.2.4 + React 19.2.4 + Tailwind CSS v4 app at localhost:3000
- Vietnamese TraSua landing page with warm amber branding
- Prisma 7.8.0 + SQLite database with full ordering schema (MenuItem, Table, Order, OrderItem)
- 18 seeded menu items (12 DRINK, 6 FOOD) with VND prices + 15 tables
- Admin auth system (cookie-based, Edge middleware protecting /admin/*)
- QR PDF generator at /api/admin/qr-pdf (A4, 3×5 grid, Vietnamese labels)
- Inter TTF font bundled locally for PDF generation
- **Customer order page** at `/order?table=N` with tabbed DRINK/FOOD menu, VND-formatted prices, sortOrder, 'Hết hàng' badge for unavailable items, and Vietnamese error pages for invalid tables
- **Cart system** with useReducer state + sessionStorage persistence keyed by tableId
- **Sticky cart bar** with item count + VND total, animated show/hide
- **Slide-up cart sheet** with qty +/-, notes per item, subtotals, grand total, 'Gửi đơn' submit
- **POST /api/order** endpoint with full validation chain (400/404/409) and Prisma transaction — broadcasts SSE new-order events
- **Order confirmation** screen with staggered animations, 'Gọi thêm món' for multi-order support
- **SSE subscriber registry** at `src/lib/sse.ts` — globalThis-cached, station-filtered broadcasts, dead subscriber cleanup
- **Order status derivation** at `src/lib/order-status.ts` — pure functions for deriveOrderStatus, isValidTransition, getValidNextStatuses, calculateOrderTotal
- **Staff API endpoints** — GET /api/staff/orders?station=bar|kitchen|all, GET /api/staff/orders/stream (SSE), PATCH /api/staff/orders/[orderId]/items/[itemId] with forward-only validation + totalAmount recalculation on cancel
- **Bar station page** at `/staff/bar` — real-time order display via SSE, one-tap status transitions PENDING→PREPARING→READY
- **Kitchen station page** at `/staff/kitchen` — FOOD items only via SSE, same status transitions
- **Overview station page** at `/staff` — all orders, all items, READY→SERVED transitions for runners
- **Staff layout** with bottom-fixed navigation (Quầy Bar / Bếp / Tổng quan) using StaffNav client component
- **Cancel button** on OrderCard items with two-tap confirmation, 3-second auto-reset
- **Reusable staff components** — StationView, OrderCard, useOrderStream hook
- **Notification system** — useNotification hook with Web Audio API chime (A5→C#6), mute toggle persisted to localStorage, AudioContext autoplay unlock prompt
- **New order pulse highlight** — amber glow animation on new OrderCards for ~2 seconds
- **Auto-hide completed orders** — categorizeOrders pure function splits into active/recentlyCompleted/hidden buckets, 30-second tick re-evaluation
- **Lịch sử toggle** — reveals hidden completed orders with count badge
- **SSE disconnection banner** — 3-second debounced "⚠️ Mất kết nối" amber banner with "Tải lại" button
- **Reconnection banner** — "✅ Đã kết nối lại" green banner for 2 seconds on reconnect
- **71 unit tests** via Vitest covering order-status derivation, cancel recalculation, SSE registry, and categorize-orders

## Core Capabilities

- **QR Table Ordering:** Pre-generated QR codes (10-20 tables) link to `http://<local-ip>:3000/order?table=N`. Customers scan, browse menu, and submit orders from their phone. ✅ Full flow delivered in M002.
- **Order Management Dashboard:** Staff see incoming orders in real-time via SSE, with status tracking (PENDING → PREPARING → READY → SERVED). Audio chime + visual pulse on new orders. ✅ All three stations + notifications delivered in M003.
- **Station Routing:** Orders auto-split into bar items (drinks) and kitchen items (food), each station sees only their items. ✅ Bar and kitchen filtering delivered in M003.
- **Item Cancellation:** Staff can cancel items with two-tap confirmation, totalAmount recalculated server-side, SSE broadcasts changes. ✅ Delivered in M003/S02.
- **Order Lifecycle:** Completed orders auto-hide after 5 minutes, Lịch sử toggle reveals history, disconnection/reconnection banners for SSE resilience. ✅ Delivered in M003/S03.
- **Menu Management:** Admin can add/edit/remove menu items, set prices, categories (drink vs food), availability toggle. Planned for M005.
- **Bill & Checkout:** Per-table bill summary, calculate totals, mark as paid. Planned for M004.
- **QR Generator:** Admin tool to generate and print QR codes for N tables. ✅ Delivered in M001.

## Tech Stack

- **Framework:** Next.js 16.2.4 (App Router) + React 19.2.4
- **Styling:** Tailwind CSS v4
- **Database:** SQLite via Prisma 7.8.0 + better-sqlite3 adapter
- **Real-time:** Server-Sent Events (SSE) via ReadableStream with globalThis subscriber registry
- **Testing:** Vitest with TypeScript path alias support
- **QR:** `qrcode` npm package + `pdfkit` for PDF generation
- **Audio:** Web Audio API OscillatorNode for notification chimes (zero external deps)
- **Deployment:** Local network (laptop/PC/tablet at the shop)

## Key Design Decisions

- Local-first: runs on shop's machine, customers connect via shop WiFi
- SQLite for zero-config database — perfect for single-shop deployment
- No auth for customers (QR = table identity); simple admin password for staff dashboard
- Staff routes (/staff/*) intentionally open — local WiFi is security boundary
- Mobile-first customer UI, tablet/desktop-optimized staff dashboard
- Vietnamese UI for all screens
- PrismaClient singleton at src/lib/prisma.ts — standard import for all DB access
- SSE subscriber registry on globalThis.__sseRegistry — same HMR-safe singleton pattern
- Order status derived from item statuses (computed, not stored separately)
- SSE broadcasts to all stations — client-side hook filters by category
- Forward-only item status transitions (PENDING→PREPARING→READY→SERVED + any→CANCELLED)
- Int prices (VND has no decimals) — simpler than Float/Decimal
- System-ui fonts for HTML, bundled Inter TTF for PDF — no CDN dependencies
- Server always re-computes totalAmount from DB prices — never trusts client
- sessionStorage keyed by tableId for cross-table cart isolation
- Route Handler (POST /api/order) over Server Action for JSON payloads with custom status codes
- Bottom navigation over top tabs for staff layout — better tablet/thumb ergonomics
- PATCH endpoint unconditionally updates both status AND totalAmount to prevent stale totals
- Two-tap cancel confirmation with 3-second auto-reset for destructive actions
- Web Audio API OscillatorNode for chimes — zero external audio dependencies, works offline
- Ref-based callback stabilization (onNewOrderRef) to prevent SSE reconnection churn
- categorizeOrders as pure function with injectable time params for testability
- 30-second bucketTick interval for time-based bucket re-evaluation (balance between precision and performance)
- max-h + opacity CSS transition for animated banners without JS animation libraries

## Architecture

```
Customer Phone → QR scan → /order?table=N (menu + cart + order)
                                ↓ POST /api/order (validated, server-computed total)
                                ↓ Order + OrderItems → SQLite (status: PENDING)
                                ↓ SSE broadcast → new-order event to all station subscribers
                                ↓ Confirmation screen → 'Gọi thêm món' → repeat

Staff Dashboard (shared layout with bottom nav: Quầy Bar / Bếp / Tổng quan)
  ├── /staff/bar → Bar Station (DRINK items only) ✅ M003/S01
  ├── /staff/kitchen → Kitchen Station (FOOD items only) ✅ M003/S02
  └── /staff → Overview (all orders, READY→SERVED for runners) ✅ M003/S02

Notification System:
  └── useNotification hook → Web Audio API chime + mute toggle + autoplay unlock
  └── useOrderStream onNewOrder callback → ref-stabilized → triggers chime + pulse

Order Lifecycle:
  └── categorizeOrders(active | recentlyCompleted | hidden) → 30s tick re-evaluation
  └── Lịch sử toggle → reveals hidden orders with count badge

SSE Pipeline: POST /api/order → broadcast(new-order)
              PATCH /api/staff/orders/:id/items/:id → broadcast(item-status-change)
              Cancel item → recalculate totalAmount → broadcast(updated order)
              Client useOrderStream hook → EventSource → filter by station → render
              Disconnection → 3s debounce → amber banner → reconnect → green banner

Admin (/admin) → protected by cookie auth + Edge middleware
  └── QR PDF Generator (/api/admin/qr-pdf)
```

## Key Patterns Established

- PrismaClient singleton at `src/lib/prisma.ts` with globalThis caching for HMR
- SSE subscriber registry at `src/lib/sse.ts` with station-level filtering and dead subscriber cleanup
- Order status derivation at `src/lib/order-status.ts` — computed from item statuses
- calculateOrderTotal pure helper for server-side total recalculation (excludes CANCELLED items)
- StationView + OrderCard reusable component pattern for station pages
- Thin Server Component page pattern — each station wraps StationView with a station prop
- useOrderStream hook: initial snapshot + incremental SSE with client-side category filtering
- Staff bottom-nav layout with extracted Client Component (StaffNav) for usePathname
- Two-tap confirmation UX for destructive actions with auto-reset timer
- Cookie-based admin auth with Edge middleware at `src/middleware.ts`
- PDFKit buffer-collection pattern for Next.js Route Handlers
- Prisma seed: deleteMany in reverse FK order → Promise.all create
- Vietnamese font bundling via `public/fonts/` for PDF generation
- Mobile-first Tailwind responsive layout with sm:/md: breakpoints
- VND formatting via shared `formatVND()` utility in `src/lib/format.ts`
- Server→Client data serialization: Prisma objects → plain objects at boundary
- Next.js 16 Promise-based searchParams: `await searchParams` in Server Components
- CartProvider useReducer + sessionStorage hydration guard pattern
- Spring-like cubic-bezier(0.32, 0.72, 0, 1) staggered entrance animations
- Server-side price computation with full FK validation chain in API routes
- Prisma $transaction for atomic multi-record creation
- useNotification hook: Web Audio API + localStorage mute + AudioContext autoplay unlock
- Ref-based callback stabilization to prevent SSE reconnection churn
- Pure function extraction for time-dependent logic (categorizeOrders with injectable time sources)
- Three-bucket order display: active / recentlyCompleted / hidden with auto-transitions
- 3-second debounced disconnection detection with reconnection success banner

## Milestone Sequence

- [x] M001: Project Foundation — Next.js setup, database schema, seed data, QR generator ✅
- [x] M002: Customer Order Flow — QR scan → menu → cart → order submission → confirmation ✅
- [x] M003: Staff Dashboard — Real-time order board, station routing (bar/kitchen), status updates, notifications, auto-hide ✅
  - [x] S01: Bar Station End-to-End (SSE + API + UI) ✅
  - [x] S02: Kitchen + Overview Stations + Item Cancellation ✅
  - [x] S03: Notifications & Auto-Hide Polish ✅
- [ ] M004: Bill & Checkout — Per-table bill, totals, payment marking
- [ ] M005: Admin & Polish — Menu management, settings, UI polish, print-ready QR sheets
