# TraSua — Hệ Thống Quản Lý Quán Trà Sữa

## What It Is

A local-network POS and order management system for a mid-range bubble tea shop. Customers scan pre-printed QR codes at their table to browse the menu and place orders from their phone. Staff receive orders in real-time on a dashboard, with automatic routing to bar (drinks) and kitchen (food) stations. Staff can view aggregated bills per table, cancel or add items, and mark tables as paid.

## Current State

**Phase:** M004 complete — Bill & Checkout fully delivered. Next up: M005 (Admin & Polish).

**What exists:**
- Next.js 16.2.4 + React 19.2.4 + Tailwind CSS v4 app at localhost:3000
- Vietnamese TraSua landing page with warm amber branding
- Prisma 7.8.0 + SQLite database with full ordering schema (MenuItem, Table, Order, OrderItem) + paidAt on Order
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
- **Staff API endpoints** — GET /api/staff/orders?station=bar|kitchen|all, GET /api/staff/orders/stream (SSE), PATCH /api/staff/orders/[orderId]/items/[itemId] with forward-only validation + totalAmount recalculation on cancel + 409 guard for PAID orders
- **GET /api/staff/menu** — Returns all menu items sorted by sortOrder
- **POST /api/staff/orders/[orderId]/items** — Add items to orders with full validation chain, atomic $transaction, SSE broadcast via item-status-change event
- **Bar station page** at `/staff/bar` — real-time order display via SSE, one-tap status transitions PENDING→PREPARING→READY
- **Kitchen station page** at `/staff/kitchen` — FOOD items only via SSE, same status transitions
- **Overview station page** at `/staff` — all orders, all items, READY→SERVED transitions for runners
- **Staff layout** with bottom-fixed navigation (Quầy Bar / Bếp / Tính tiền / Tổng quan) using StaffNav client component
- **Cancel button** on OrderCard items with two-tap confirmation, 3-second auto-reset
- **Reusable staff components** — StationView, OrderCard, useOrderStream hook (with REMOVE_ORDERS action + order-paid SSE listener)
- **Notification system** — useNotification hook with Web Audio API chime, mute toggle persisted to localStorage
- **Auto-hide completed orders** — categorizeOrders splits into active/recentlyCompleted/hidden buckets, 30-second tick
- **Lịch sử toggle** — reveals hidden completed orders with count badge
- **SSE disconnection/reconnection banners** — debounced warning + auto-dismiss on reconnect
- **Checkout tab** at `/staff/checkout` — table list with unpaid orders, bill detail view with item aggregation, cancelled items struck through, cancel-from-bill (two-tap), mark-paid (two-tap) with atomic $transaction + SSE broadcast
- **Bill APIs** — GET /api/staff/tables/[tableId]/bill, POST /api/staff/tables/[tableId]/pay, GET /api/staff/checkout
- **PAID order exclusion** — station views exclude PAID orders, item PATCH returns 409 on PAID orders
- **MenuPickerModal** — bottom-sheet modal with DRINK/FOOD tabs, quantity selector, notes input, 409 error handling; wired into BillView
- **111 unit tests** via Vitest covering order-status, cancel, SSE, categorize-orders, PAID guards, bill aggregation, orderReducer, add-item validation

## Core Capabilities

| Capability | Status | Milestone |
|---|---|---|
| QR Table Ordering | ✅ Delivered | M001 (QR gen), M002 (order flow) |
| Order Management Dashboard | ✅ Delivered | M003 (SSE, stations, notifications) |
| Station Routing (bar/kitchen) | ✅ Delivered | M003 |
| Item Cancellation | ✅ Delivered | M003/S02, extended in M004/S01 |
| Add Item from Bill | ✅ Delivered | M004/S02 |
| Order Lifecycle (auto-hide, history) | ✅ Delivered | M003/S03 |
| Bill & Checkout | ✅ Delivered | M004 (S01 + S02) |
| Menu Management | 🔜 Planned | M005 |
| QR Generator | ✅ Delivered | M001 |

## Tech Stack

- **Framework:** Next.js 16.2.4 (App Router) + React 19.2.4
- **Styling:** Tailwind CSS v4
- **Database:** SQLite via Prisma 7.8.0 + better-sqlite3 adapter
- **Real-time:** Server-Sent Events (SSE) via ReadableStream with globalThis subscriber registry
- **Testing:** Vitest with TypeScript path alias support (111 tests)
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
- PAID is order-level override — set by mark-paid API, not derived from items
- SSE broadcasts to all stations — client-side hook filters by category
- Forward-only item status transitions (PENDING→PREPARING→READY→SERVED + any→CANCELLED)
- Reuse item-status-change SSE event type for add-item broadcasts — zero client changes needed
- Bill totals computed from raw items excluding CANCELLED (not from stored totalAmount) for multi-order consistency
- Two-tap confirmation pattern for destructive actions with color-coded states and 3s auto-reset

## Architecture

```
Customer Phone → QR scan → /order?table=N (menu + order)
                                ↓ order submitted (POST /api/order)
                                ↓ SSE broadcast (new-order)
Staff Dashboard (/staff) → receives orders in real-time via SSE
  ├── Bar Station (/staff/bar) — DRINK items, PENDING→PREPARING→READY
  ├── Kitchen Station (/staff/kitchen) — FOOD items, same transitions
  ├── Overview (/staff) — all items, READY→SERVED
  └── Checkout (/staff/checkout) — bill aggregation, cancel/add items, mark paid
                                ↓ mark paid (POST /api/staff/tables/[id]/pay)
                                ↓ SSE broadcast (order-paid) → stations clear
```

## Milestone Sequence

- [x] M001: Project Foundation — Next.js setup, database schema, seed data, QR generator
- [x] M002: Customer Order Flow — QR scan → menu → order submission (mobile-first UI)
- [x] M003: Staff Dashboard — Real-time order board, station routing (bar/kitchen), status updates
- [x] M004: Bill & Checkout — Per-table bill, totals, cancel/add items, payment marking, SSE propagation
- [ ] M005: Admin & Polish — Menu management, settings, UI polish, print-ready QR sheets
