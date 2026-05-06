# S03: QR Code Generator

**Goal:** Admin page at /admin with password auth (cookie-based) and QR PDF generator. Visit /admin → authenticate → see table config → click to download printable A4 PDF with QR codes for N tables. Each QR encodes http://SHOP_IP:SHOP_PORT/order?table=N.
**Demo:** /admin/qr hiển thị QR các bàn → scan mở đúng /order?table=N

## Must-Haves

- `npx tsc --noEmit` zero errors
- `npm run build` succeeds with no type errors
- src/middleware.ts protects /admin/* routes — unauthenticated requests redirect to /admin/login
- Login with correct ADMIN_PASSWORD sets httpOnly auth cookie and redirects to /admin
- Login with wrong password shows Vietnamese error message "Sai mật khẩu"
- GET /api/admin/qr-pdf (authenticated) returns application/pdf with Content-Disposition: attachment
- PDF contains TABLE_COUNT QR codes in 3×5 A4 grid layout
- Each QR code encodes http://SHOP_IP:SHOP_PORT/order?table=N (absolute URL)
- PDF uses embedded Vietnamese font for "Bàn N" labels (not Helvetica fallback)
- Admin page has Vietnamese text throughout, mobile-first responsive layout
- No Google Fonts or CDN requests at runtime (R006 offline)
- Threat Surface (Q3):
- Abuse: Admin password brute-force on local network — acceptable risk for tea shop. No rate limiting planned.
- Data exposure: ADMIN_PASSWORD in .env (server-only), admin cookie is httpOnly/sameSite:lax. SHOP_IP visible in admin page (local network address, not sensitive).
- Input trust: Password from login form validated server-side. TABLE_COUNT/SHOP_IP from env vars (trusted).
- Requirement Impact (Q4):
- R005 directly delivered: QR codes for 10-20 tables, printable PDF
- R006 supported: qrcode + pdfkit are pure Node.js, font bundled in repo, no CDN at runtime
- R007 supported: Vietnamese admin UI, mobile-first layout with Tailwind responsive classes
- D002 honored: QR URLs use the static format http://SHOP_IP:SHOP_PORT/order?table=N

## Proof Level

- This slice proves: This slice proves: integration — real QR codes generated, real PDF produced, real auth protecting the page.
Real runtime required: yes (dev server needed for full flow test).
Human/UAT required: yes for QR scan verification, but machine verification covers build, types, file existence, and content correctness.

## Integration Closure

Upstream surfaces consumed: S01 provides Next.js skeleton (src/app/layout.tsx, src/app/globals.css, package.json), PrismaClient singleton pattern at src/lib/prisma.ts (not used in this slice — QR uses env vars not DB).
New wiring introduced: src/middleware.ts (new file — first middleware in project), admin route tree (/admin/*, /api/admin/*), QR PDF API endpoint.
What remains: /order?table=N page does not exist yet — QR codes will link to it but it won't be functional until a later milestone. This is expected; the QR codes are printed ahead of time.

## Verification

- Run the task and slice verification checks for this slice.

## Tasks

- [x] **T01: Install QR/PDF deps, configure env vars, build admin auth with login page, and bundle Vietnamese font** `est:45m`
  Install qrcode + pdfkit for QR PDF generation, create the admin auth system (helpers, middleware, login page + API route), and bundle a Vietnamese-supporting TTF font for PDF labels. This unblocks all subsequent S03 tasks.
  - Files: `package.json`, `.env`, `src/lib/auth.ts`, `src/middleware.ts`, `src/app/admin/login/page.tsx`, `src/app/api/admin/login/route.ts`, `public/fonts/`
  - Verify: npx tsc --noEmit && npm run build && grep -q ADMIN_PASSWORD .env && test -f src/middleware.ts && test -f src/lib/auth.ts && test -f src/app/admin/login/page.tsx && test -f src/app/api/admin/login/route.ts && ls public/fonts/*.ttf

- [x] **T02: Build QR PDF generation API route with pdfkit and qrcode at /api/admin/qr-pdf** `est:45m`
  Create the core API route that generates a downloadable A4 PDF containing a grid of QR codes for all tables. This is the primary deliverable of the slice and the riskiest technical piece — PDFKit streaming in Next.js Route Handlers has specific patterns.
  - Files: `src/app/api/admin/qr-pdf/route.ts`
  - Verify: npx tsc --noEmit && npm run build && grep -q 'PDFDocument\|pdfkit' src/app/api/admin/qr-pdf/route.ts && grep -q 'order?table=' src/app/api/admin/qr-pdf/route.ts

- [x] **T03: Build Vietnamese admin page at /admin with QR generator UI and PDF download button** `est:30m`
  Create the admin main page — the user-facing integration point that wires the QR PDF API to a polished Vietnamese interface. This is a Server Component that reads env vars and provides a download link.
  - Files: `src/app/admin/page.tsx`
  - Verify: npx tsc --noEmit && npm run build && grep -q 'Tạo QR' src/app/admin/page.tsx && grep -q 'qr-pdf' src/app/admin/page.tsx

## Files Likely Touched

- package.json
- .env
- src/lib/auth.ts
- src/middleware.ts
- src/app/admin/login/page.tsx
- src/app/api/admin/login/route.ts
- public/fonts/
- src/app/api/admin/qr-pdf/route.ts
- src/app/admin/page.tsx
