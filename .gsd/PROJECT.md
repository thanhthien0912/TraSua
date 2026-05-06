# TraSua — Hệ Thống Quản Lý Quán Trà Sữa

## What It Is

A local-network POS and order management system for a mid-range bubble tea shop. Customers scan pre-printed QR codes at their table to browse the menu and place orders from their phone. Staff receive orders in real-time on a dashboard, with automatic routing to bar (drinks) and kitchen (food) stations.

## Current State

**Phase:** M001 in progress — S01 (project foundation) complete. App skeleton running at localhost:3000 with Vietnamese TraSua landing page, Prisma 7 + SQLite pipeline working. S02 (database schema & seed data) and S03 (QR generator) pending.

**What works now:**
- `npm run dev` → localhost:3000 serves Vietnamese TraSua landing page
- `npm run build` → clean build, zero TypeScript errors
- Prisma 7 + SQLite pipeline: schema → migration → generated client → singleton
- Mobile-first responsive layout (375px to desktop)
- Fully offline — no external fonts, CDNs, or services

## Core Capabilities

- **QR Table Ordering:** Pre-generated QR codes (10-20 tables) link to `http://<local-ip>:3000/order?table=N`. Customers scan, browse menu, and submit orders from their phone.
- **Order Management Dashboard:** Staff see incoming orders in real-time, with status tracking (new → preparing → ready → served).
- **Station Routing:** Orders auto-split into bar items (drinks/tea) and kitchen items (food), each station sees only their items.
- **Menu Management:** Admin can add/edit/remove menu items, set prices, categories (drink vs food), availability toggle.
- **Bill & Checkout:** Per-table bill summary, calculate totals, mark as paid.
- **QR Generator:** Admin tool to generate and print QR codes for N tables.

## Tech Stack

- **Framework:** Next.js 16.2.4 (App Router) + React 19.2.4
- **Styling:** Tailwind CSS v4
- **Database:** SQLite via Prisma 7.8.0 + better-sqlite3 adapter — zero-config, local file DB
- **Language:** TypeScript (strict), Vietnamese UI (lang="vi")
- **Real-time:** Server-Sent Events (SSE) or polling for order updates (planned)
- **QR:** `qrcode` npm package for generation (planned)
- **Deployment:** Local network (laptop/PC/tablet at the shop)

## Key Design Decisions

- Local-first: runs on shop's machine, customers connect via shop WiFi (R006)
- SQLite for zero-config database — perfect for single-shop deployment
- System-ui font stack (no Google Fonts) for offline compliance
- PrismaClient singleton at `src/lib/prisma.ts` with globalThis caching for HMR
- Generated Prisma client at `generated/prisma/` (project root)
- No auth for customers (QR = table identity); simple admin password for staff dashboard
- Mobile-first customer UI with Tailwind sm:/md: breakpoints (R007)
- Vietnamese UI for customer-facing screens
- Warm amber color palette for tea-house branding

## Architecture

```
Customer Phone → QR scan → /order?table=N (menu + order)
                                ↓ order submitted
Staff Dashboard (/staff) → receives orders in real-time
  ├── Bar Station (drinks/tea items)
  └── Kitchen Station (food items)
```

## Key Paths

- `src/app/` — Next.js App Router pages
- `src/lib/prisma.ts` — PrismaClient singleton
- `prisma/schema.prisma` — Database schema
- `prisma/dev.db` — SQLite database file
- `generated/prisma/` — Generated Prisma client

## Milestone Sequence

- [ ] M001: Project Foundation — Next.js setup, database schema, seed data, QR generator
  - [x] S01: Next.js + Tailwind + Prisma Setup ✅
  - [ ] S02: Database Schema & Seed Data
  - [ ] S03: QR Code Generator
- [ ] M002: Customer Order Flow — QR scan → menu → order submission (mobile-first UI)
- [ ] M003: Staff Dashboard — Real-time order board, station routing (bar/kitchen), status updates
- [ ] M004: Bill & Checkout — Per-table bill, totals, payment marking
- [ ] M005: Admin & Polish — Menu management, settings, UI polish, print-ready QR sheets
