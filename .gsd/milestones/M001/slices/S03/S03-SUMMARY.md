---
id: S03
parent: M001
milestone: M001
provides:
  - ["Admin auth system (middleware + cookie-based auth helpers at src/lib/auth.ts)", "QR PDF generation API at /api/admin/qr-pdf", "Admin page with Vietnamese UI at /admin", "Login flow at /admin/login"]
requires:
  []
affects:
  []
key_files:
  - ["src/middleware.ts", "src/lib/auth.ts", "src/app/admin/page.tsx", "src/app/admin/login/page.tsx", "src/app/api/admin/login/route.ts", "src/app/api/admin/qr-pdf/route.ts", "public/fonts/Inter.ttf"]
key_decisions:
  - ["Edge-compatible cookie auth (httpOnly, SameSite=Lax, no Secure for HTTP local network)", "PDFKit buffer-collection pattern instead of pipe for Next.js Response compatibility", "Explicit runtime='nodejs' on QR PDF route for pdfkit Node.js API access", "Inter TTF from Google Fonts static CDN (GitHub raw URLs redirect to HTML for large repos)", "<a> tag for PDF download instead of button+JS — browser natively handles Content-Disposition"]
patterns_established:
  - ["Cookie-based admin auth with Edge middleware protecting /admin/* and /api/admin/*", "PDFKit buffer-collection streaming pattern for Next.js Route Handlers", "Warm amber theme for admin pages matching customer-facing design system", "Vietnamese font bundling via public/fonts/ for PDF generation"]
observability_surfaces:
  - ["GET /api/admin/qr-pdf returns 401 (no auth), 400 (missing SHOP_IP or TABLE_COUNT=0), 500 (missing font) — structured error responses for each failure mode"]
drill_down_paths:
  - [".gsd/milestones/M001/slices/S03/tasks/T01-SUMMARY.md", ".gsd/milestones/M001/slices/S03/tasks/T02-SUMMARY.md", ".gsd/milestones/M001/slices/S03/tasks/T03-SUMMARY.md"]
duration: ""
verification_result: passed
completed_at: 2026-05-06T03:37:11.750Z
blocker_discovered: false
---

# S03: QR Code Generator

**Admin auth system with cookie-based middleware + QR PDF generator API producing printable A4 sheets with Vietnamese labels for N configurable tables**

## What Happened

S03 delivered three capabilities in sequence:

**T01 — Auth foundation:** Installed `qrcode` and `pdfkit` runtime deps plus their type declarations. Created an Edge-compatible admin auth system: `src/lib/auth.ts` exports password validation and cookie helpers (httpOnly, SameSite=Lax, no Secure for HTTP local network). `src/middleware.ts` protects all `/admin/*` and `/api/admin/*` routes via `config.matcher`, exempting `/admin/login` and `/api/admin/login`. The login page at `/admin/login` is a client component with warm amber theme, shake-on-error animation, Vietnamese UI text, and 48px minimum hit areas. The login API at `/api/admin/login` validates password server-side and sets the auth cookie. Bundled Inter Regular TTF font (334KB) from Google Fonts static CDN for PDF Vietnamese diacritics.

**T02 — QR PDF API:** Created `GET /api/admin/qr-pdf` — the core deliverable. The route is auth-gated (returns 401 without valid cookie), validates env vars (SHOP_IP required, SHOP_PORT defaults to 3000, TABLE_COUNT defaults to 15, TABLE_COUNT=0 returns 400), checks for the font file, then generates an A4 PDF with a 3×5 grid layout. Each cell contains a 120×120pt QR code encoding `http://SHOP_IP:SHOP_PORT/order?table=N`, a "Bàn N" label in 14pt Inter, and a "Quét để đặt món" subtitle in 10pt. Pages auto-paginate every 15 tables. Uses buffer-collection pattern (chunks array + end promise) instead of pipe() for Next.js Response compatibility. Explicitly set `runtime = "nodejs"` since pdfkit needs Node.js Buffer/fs APIs.

**T03 — Admin UI:** Rewrote the stub admin page into a full Server Component reading TABLE_COUNT, SHOP_IP, SHOP_PORT from process.env. Shows a configuration card (table count, shop address with "Chưa cấu hình" fallback), a primary CTA `<a>` linking to `/api/admin/qr-pdf` (browser-native PDF download via Content-Disposition), and logout link. Warm amber theme consistent with login page, mobile-first responsive layout.

All three tasks built cleanly with zero TypeScript errors and successful `npm run build`.

## Verification

**Slice-level verification — all checks passed:**

1. `npx tsc --noEmit` → zero errors (2.8s)
2. `npm run build` → success, all routes rendered: /admin (static), /admin/login (static), /api/admin/login (dynamic), /api/admin/qr-pdf (dynamic)
3. Content checks via Node.js fs.readFileSync + .includes():
   - ✅ 'Tạo QR' found in src/app/admin/page.tsx (Vietnamese CTA text)
   - ✅ 'qr-pdf' found in src/app/admin/page.tsx (API link)
   - ✅ 'order?table=' found in src/app/api/admin/qr-pdf/route.ts (QR URL format)
   - ✅ 'PDFDocument' found in src/app/api/admin/qr-pdf/route.ts (pdfkit usage)
4. File existence checks — all present:
   - src/middleware.ts, src/lib/auth.ts, src/app/admin/login/page.tsx
   - src/app/api/admin/login/route.ts, src/app/api/admin/qr-pdf/route.ts
   - src/app/admin/page.tsx, public/fonts/Inter.ttf
5. ADMIN_PASSWORD confirmed in .env

Note: Original verification commands used `grep` which doesn't exist on Windows. Verification adapted to use Node.js fs checks (cross-platform) and `findstr` in task-level verification.

## Requirements Advanced

- R005 — QR codes generated for N configurable tables as printable A4 PDF with 3×5 grid layout, Vietnamese labels, and correct URL encoding
- R006 — qrcode + pdfkit are pure Node.js packages, Inter.ttf font bundled locally, no CDN or external requests at runtime
- R007 — Vietnamese admin UI throughout (login, admin page, PDF labels), mobile-first responsive layout with Tailwind

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

Created src/app/admin/page.tsx in T01 (not originally scoped) as a minimal stub needed for the middleware redirect target. This was then fully built out in T03 as planned. Also added clearAdminCookie() helper for future logout support beyond task scope. Neither deviation changed the slice goal or deliverables.

## Known Limitations

Logout link navigates to /admin/login but doesn't explicitly clear the auth cookie — clearAdminCookie() helper exists but requires a dedicated API route or client component. The /order?table=N target pages don't exist yet (expected — built in M002). Next.js 16.2.4 middleware deprecation warning is informational only.

## Follow-ups

Build dedicated /api/admin/logout route using clearAdminCookie() helper (low priority — cookie expires in 24h). Migrate from middleware to proxy convention when Next.js formally removes middleware support (future version).

## Files Created/Modified

- `package.json` — Added qrcode, pdfkit as runtime deps; @types/pdfkit, @types/qrcode as devDeps
- `.env` — Added ADMIN_PASSWORD, SHOP_IP, SHOP_PORT, TABLE_COUNT env vars
- `src/lib/auth.ts` — Edge-compatible admin auth helpers: validateAdminPassword, checkAdminCookie, buildAdminCookie, clearAdminCookie
- `src/middleware.ts` — Route protection for /admin/* and /api/admin/*, exempting login routes
- `src/app/admin/login/page.tsx` — Client component login page with warm amber theme, Vietnamese text, shake animation on error
- `src/app/api/admin/login/route.ts` — POST handler for password validation, sets httpOnly auth cookie
- `src/app/admin/page.tsx` — Server Component admin page with config display, QR PDF download CTA, Vietnamese UI
- `src/app/api/admin/qr-pdf/route.ts` — GET handler generating A4 PDF with 3×5 QR code grid, Vietnamese labels via Inter font
- `public/fonts/Inter.ttf` — Inter Regular TTF font (334KB) for Vietnamese diacritics in PDF generation
