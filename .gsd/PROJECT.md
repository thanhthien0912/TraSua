# TraSua — Hệ Thống Quản Lý Quán Trà Sữa

## What It Is

A local-network POS and order management system for a mid-range bubble tea shop. Customers scan pre-printed QR codes at their table to browse the menu and place orders from their phone. Staff receive orders in real-time on a dashboard, with automatic routing to bar (drinks) and kitchen (food) stations.

## Current State

**Phase:** Project initialization — no code yet.

## Core Capabilities

- **QR Table Ordering:** Pre-generated QR codes (10-20 tables) link to `http://<local-ip>:3000/order?table=N`. Customers scan, browse menu, and submit orders from their phone.
- **Order Management Dashboard:** Staff see incoming orders in real-time, with status tracking (new → preparing → ready → served).
- **Station Routing:** Orders auto-split into bar items (drinks/tea) and kitchen items (food), each station sees only their items.
- **Menu Management:** Admin can add/edit/remove menu items, set prices, categories (drink vs food), availability toggle.
- **Bill & Checkout:** Per-table bill summary, calculate totals, mark as paid.
- **QR Generator:** Admin tool to generate and print QR codes for N tables.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Database:** SQLite (via Prisma) — simple, no external DB server needed for local use
- **Real-time:** Server-Sent Events (SSE) or polling for order updates
- **QR:** `qrcode` npm package for generation
- **Deployment:** Local network (laptop/PC/tablet at the shop)

## Key Design Decisions

- Local-first: runs on shop's machine, customers connect via shop WiFi
- SQLite for zero-config database — perfect for single-shop deployment
- No auth for customers (QR = table identity); simple admin password for staff dashboard
- Mobile-first customer UI, tablet/desktop-optimized staff dashboard
- Vietnamese UI for customer-facing screens

## Architecture

```
Customer Phone → QR scan → /order?table=N (menu + order)
                                ↓ order submitted
Staff Dashboard (/staff) → receives orders in real-time
  ├── Bar Station (drinks/tea items)
  └── Kitchen Station (food items)
```

## Milestone Sequence

- [ ] M001: Project Foundation — Next.js setup, database schema, seed data, QR generator
- [ ] M002: Customer Order Flow — QR scan → menu → order submission (mobile-first UI)
- [ ] M003: Staff Dashboard — Real-time order board, station routing (bar/kitchen), status updates
- [ ] M004: Bill & Checkout — Per-table bill, totals, payment marking
- [ ] M005: Admin & Polish — Menu management, settings, UI polish, print-ready QR sheets
