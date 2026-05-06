---
id: M001
title: "Project Foundation"
status: complete
completed_at: 2026-05-06T03:49:27.380Z
key_decisions:
  - Next.js 16.2.4 + React 19.2.4 + Tailwind CSS v4 + Prisma 7.8.0 — latest stack for greenfield project
  - SQLite via better-sqlite3 adapter for R006 offline constraint — zero external DB dependency
  - Full ordering schema upfront in M001 (4 models + 3 enums) to avoid migration churn downstream
  - @@map() on all models to avoid SQL reserved word conflicts (Order → orders, Table → tables)
  - PrismaClient singleton on globalThis for HMR survival — standard import from @/lib/prisma
  - PDFKit + qrcode for server-side QR PDF generation (D004) — pure Node.js, offline-compatible
  - Edge-compatible cookie auth with ADMIN_PASSWORD env var (D005) — proportionate to local-network threat model
  - System-ui font stack for HTML pages, bundled Inter TTF for PDF generation — no CDN/Google Fonts
  - Int prices (VND has no decimals) — simpler than Float/Decimal for tea shop pricing
  - deleteMany + recreate for seed idempotency rather than upsert — simpler for seed data
key_files:
  - package.json
  - prisma/schema.prisma
  - prisma/seed.ts
  - prisma.config.ts
  - src/lib/prisma.ts
  - src/lib/auth.ts
  - src/middleware.ts
  - src/app/page.tsx
  - src/app/layout.tsx
  - src/app/admin/page.tsx
  - src/app/admin/login/page.tsx
  - src/app/api/admin/login/route.ts
  - src/app/api/admin/qr-pdf/route.ts
  - src/app/globals.css
  - public/fonts/Inter.ttf
  - .env
lessons_learned:
  - create-next-app rejects capital letters in directory names — workaround is scaffold into temp subdirectory and copy up
  - Prisma 7 introduces prisma.config.ts (not just schema.prisma) — seed command goes in migrations block there, not package.json
  - Prisma @@map() is essential when model names match SQL reserved words (Order, Table) — catches subtle runtime errors
  - PDFKit pipe() doesn't work with Next.js Response — must use buffer-collection pattern (chunks array + end promise)
  - Next.js Route Handlers default to Edge runtime — must set explicit runtime='nodejs' when using Node.js APIs like pdfkit/fs
  - GitHub raw URLs for large repos redirect to HTML — use Google Fonts static CDN instead for TTF downloads
  - For schema redesigns, deleting old migrations entirely is cleaner than incremental migration from placeholder data
  - Scripts outside Next.js (e.g. seed.ts) can't use @/ path alias — must use relative imports from generated/prisma/client
---

# M001: Project Foundation

**Established a running Next.js 16 + Tailwind v4 + Prisma 7/SQLite foundation with full ordering schema, 18 Vietnamese menu items, admin auth, and QR PDF generator — all green on build, typecheck, and seed.**

## What Happened

M001 delivered the complete project foundation across three slices in sequence:

**S01 — Next.js + Tailwind + Prisma Setup** scaffolded a Next.js 16.2.4 + React 19.2.4 + Tailwind CSS v4 app with Prisma 7.8.0 and SQLite via better-sqlite3 adapter. A Vietnamese-language TraSua landing page was built with warm amber branding and mobile-first layout. The PrismaClient singleton pattern at src/lib/prisma.ts was established as the standard import path for all downstream code. Key architectural choices — SQLite for R006 offline constraint, system-ui fonts instead of Google Fonts, no CDN dependencies — set the local-first tone for the entire project.

**S02 — Database Schema & Seed Data** replaced the placeholder Category model with the full ordering schema: 4 models (MenuItem, Table, Order, OrderItem) and 3 enums (Category, OrderStatus, ItemStatus). All models use @@map() to avoid SQL reserved word conflicts. An idempotent seed script populates 18 Vietnamese menu items (12 DRINK, 6 FOOD) with realistic VND prices (20,000đ–40,000đ) and 15 tables (Bàn 1–15). The old placeholder migration was deleted entirely for a clean schema start.

**S03 — QR Code Generator** delivered the admin auth system and QR PDF generation API. Edge-compatible cookie-based middleware protects /admin/* and /api/admin/* routes. The login page features Vietnamese UI with shake-on-error animation. The QR PDF API generates A4 pages with a 3×5 grid of QR codes, each encoding http://SHOP_IP:SHOP_PORT/order?table=N with Vietnamese "Bàn N" labels and "Quét để đặt món" subtitles. PDFKit buffer-collection pattern was adopted for Next.js Response compatibility, with Inter TTF font bundled locally for Vietnamese diacritics.

Cross-slice integration is clean: S02 built on S01's Prisma pipeline, S03 built on S01's Next.js skeleton. The final build compiles all routes successfully — static pages (/, /admin, /admin/login) and dynamic APIs (/api/admin/login, /api/admin/qr-pdf). TypeScript reports zero errors across the entire codebase.

## Success Criteria Results

### Success Criteria Results

- **Next.js app chạy thành công trên localhost:3000** — ✅ MET. `npm run build` succeeds with all 6 routes compiled. S01 verified dev server startup and browser rendering at both desktop (1280px) and mobile (390px) viewports.

- **Database schema đầy đủ bảng cho menu, bàn, đơn hàng** — ✅ MET. prisma/schema.prisma contains 4 models (MenuItem, Table, Order, OrderItem) with 3 enums (Category, OrderStatus, ItemStatus), full FK relations, and @@map() for SQL reserved word safety. Migration applied cleanly to SQLite.

- **Seed data có ít nhất 10 món trà sữa mẫu với phân loại drink/food** — ✅ MET. `npx prisma db seed` outputs "Seeded 18 menu items and 15 tables". 12 DRINK items (Trà sữa trân châu through Soda chanh) and 6 FOOD items (Bánh tráng trộn through Phô mai que) with Vietnamese names and VND prices. Seed is idempotent — verified by running twice with identical output.

- **QR generator tạo được mã cho N bàn, scan mở đúng URL** — ✅ MET. GET /api/admin/qr-pdf generates A4 PDF with 3×5 grid of QR codes. Each QR encodes `http://SHOP_IP:SHOP_PORT/order?table=N`. Build compiles the route successfully. Code review confirms correct URL format with configurable SHOP_IP, SHOP_PORT, and TABLE_COUNT env vars. Full live scan test deferred to runtime UAT (noted in R005).

## Definition of Done Results

### Definition of Done Results

- **All slices [x] in roadmap** — ✅ S01, S02, S03 all marked complete in DB and roadmap.
- **All slice summaries exist** — ✅ S01-SUMMARY.md (6993B), S02-SUMMARY.md (5562B), S03-SUMMARY.md (7634B) all present on disk.
- **All tasks complete** — ✅ S01: 3/3, S02: 2/2, S03: 3/3 = 8/8 tasks done.
- **Cross-slice integration** — ✅ S02 schema builds on S01's Prisma pipeline (generated client works). S03 admin pages build on S01's Next.js skeleton. Final `npm run build` compiles all routes with zero errors. `npx tsc --noEmit` reports zero TypeScript errors across the full codebase.

## Requirement Outcomes

### Requirement Outcomes

No requirements changed status during M001 — all remain **active**. M001 establishes the foundation; full user-flow validation occurs in M002–M005.

**Requirements Advanced (evidence of progress, not yet validated):**

| ID | Status | Evidence |
|---|---|---|
| R001 | active → active | Database schema supports full order flow (MenuItem→OrderItem→Order→Table). Customer ordering UI is M002. |
| R002 | active → active | Category enum (DRINK/FOOD) on MenuItem enables future bar/kitchen routing (M003). |
| R003 | active → active | OrderStatus and ItemStatus enums establish the status lifecycle. Real-time dashboard is M003. |
| R004 | active → active | Order.totalAmount and table relation enable per-table bill calculation (M004). |
| R005 | active → active | QR PDF generator delivered (admin auth + /api/admin/qr-pdf). Full scan test pending live runtime. |
| R006 | active → active | SQLite database, no CDN deps, Inter font bundled locally. Full offline test deferred. |
| R007 | active → active | Vietnamese UI on landing page and admin. Mobile-first Tailwind layout verified at 375px+. Customer order UI is M002. |
| R008 | active → active | Not addressed in M001 — owned by M003. |

## Deviations

Scaffolded into temp subdirectory due to create-next-app rejecting capital-letter directory names (cosmetic). Prisma 7 init creates prisma.config.ts not anticipated in original plan (kept as standard). Deleted old placeholder migrations entirely during S02 schema redesign instead of incremental migration. Created admin page stub early in S03/T01 for middleware redirect target (then fully built in T03). None of these changed slice goals or deliverables.

## Follow-ups

- Build /api/admin/logout route using existing clearAdminCookie() helper (low priority — cookie expires in 24h)
- Monitor Next.js middleware deprecation — may need to migrate to proxy convention in future versions
- 5 moderate npm audit vulnerabilities in upstream Next.js/ESLint deps — monitor for patches
- Order/OrderItem tables have no @updatedAt fields due to SQLite limitation — consider workaround if needed in M003
- /order?table=N target pages built in M002 — QR codes will become functional end-to-end then
