# TraSua — Hệ Thống Quản Lý Quán Trà Sữa

## What It Is

A local-network POS and order management system for a mid-range bubble tea shop. Customers scan pre-printed QR codes at their table to browse the menu and place orders from their phone. Staff receive orders in real-time on a dashboard, with automatic routing to bar (drinks) and kitchen (food) stations.

## Current State

**Phase:** M001 complete — project foundation established. Next.js 16 app running with Prisma 7/SQLite, full ordering schema (4 models, 3 enums), 18 Vietnamese menu items seeded, admin auth, and QR PDF generator operational. Ready for M002 (Customer Order Flow).

**What exists:**
- Next.js 16.2.4 + React 19.2.4 + Tailwind CSS v4 app at localhost:3000
- Vietnamese TraSua landing page with warm amber branding
- Prisma 7.8.0 + SQLite database with full ordering schema (MenuItem, Table, Order, OrderItem)
- 18 seeded menu items (12 DRINK, 6 FOOD) with VND prices + 15 tables
- Admin auth system (cookie-based, Edge middleware protecting /admin/*)
- QR PDF generator at /api/admin/qr-pdf (A4, 3×5 grid, Vietnamese labels)
- Inter TTF font bundled locally for PDF generation

## Core Capabilities

- **QR Table Ordering:** Pre-generated QR codes (10-20 tables) link to `http://<local-ip>:3000/order?table=N`. Customers scan, browse menu, and submit orders from their phone.
- **Order Management Dashboard:** Staff see incoming orders in real-time, with status tracking (new → preparing → ready → served).
- **Station Routing:** Orders auto-split into bar items (drinks/tea) and kitchen items (food), each station sees only their items.
- **Menu Management:** Admin can add/edit/remove menu items, set prices, categories (drink vs food), availability toggle.
- **Bill & Checkout:** Per-table bill summary, calculate totals, mark as paid.
- **QR Generator:** Admin tool to generate and print QR codes for N tables. ✅ Delivered in M001.

## Tech Stack

- **Framework:** Next.js 16.2.4 (App Router) + React 19.2.4
- **Styling:** Tailwind CSS v4
- **Database:** SQLite via Prisma 7.8.0 + better-sqlite3 adapter
- **Real-time:** Server-Sent Events (SSE) or polling for order updates (planned for M003)
- **QR:** `qrcode` npm package + `pdfkit` for PDF generation
- **Deployment:** Local network (laptop/PC/tablet at the shop)

## Key Design Decisions

- Local-first: runs on shop's machine, customers connect via shop WiFi
- SQLite for zero-config database — perfect for single-shop deployment
- No auth for customers (QR = table identity); simple admin password for staff dashboard
- Mobile-first customer UI, tablet/desktop-optimized staff dashboard
- Vietnamese UI for customer-facing screens
- PrismaClient singleton at src/lib/prisma.ts — standard import for all DB access
- Int prices (VND has no decimals) — simpler than Float/Decimal
- System-ui fonts for HTML, bundled Inter TTF for PDF — no CDN dependencies

## Architecture

```
Customer Phone → QR scan → /order?table=N (menu + order)
                                ↓ order submitted
Staff Dashboard (/staff) → receives orders in real-time
  ├── Bar Station (drinks/tea items)
  └── Kitchen Station (food items)

Admin (/admin) → protected by cookie auth + Edge middleware
  └── QR PDF Generator (/api/admin/qr-pdf)
```

## Key Patterns Established (M001)

- PrismaClient singleton at `src/lib/prisma.ts` with globalThis caching for HMR
- Cookie-based admin auth with Edge middleware at `src/middleware.ts`
- PDFKit buffer-collection pattern for Next.js Route Handlers
- Prisma seed: deleteMany in reverse FK order → Promise.all create
- Vietnamese font bundling via `public/fonts/` for PDF generation
- Mobile-first Tailwind responsive layout with sm:/md: breakpoints

## Milestone Sequence

- [x] M001: Project Foundation — Next.js setup, database schema, seed data, QR generator ✅
- [ ] M002: Customer Order Flow — QR scan → menu → order submission (mobile-first UI)
- [ ] M003: Staff Dashboard — Real-time order board, station routing (bar/kitchen), status updates
- [ ] M004: Bill & Checkout — Per-table bill, totals, payment marking
- [ ] M005: Admin & Polish — Menu management, settings, UI polish, print-ready QR sheets
