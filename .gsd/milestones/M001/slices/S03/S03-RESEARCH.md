# S03: QR Code Generator — Research

**Date:** 2025-07-10

## Summary

S03 delivers the admin page with password protection and a QR code PDF generator — the first tangible deliverable the shop owner can use (print QR codes, stick on tables). This involves: (1) admin auth middleware checking `ADMIN_PASSWORD` env var with cookie persistence, (2) admin page UI at `/admin` with Vietnamese text, (3) QR generation API route that produces a printable A4 PDF with QR codes for N tables in a grid layout.

The primary technical question — which PDF library — is resolved by this research. **PDFKit** is the best choice for server-side PDF generation in a Next.js API route: it's a pure Node.js library with a simple streaming API, supports embedding PNG images from Buffers (perfect for QR codes from `qrcode` package), handles A4 page sizing natively, and has no browser/React dependencies. Combined with the `qrcode` npm package (which generates QR codes as PNG Buffers or data URLs), this gives a clean server-side pipeline: generate QR images → embed in PDF → stream to client.

Requirements covered: R005 (QR codes for 10-20 tables, printable PDF), R006 (offline — both `qrcode` and `pdfkit` are pure Node.js, no CDN), R007 (Vietnamese labels "Bàn N" and instructions on the PDF).

## Recommendation

**Use `qrcode` + `pdfkit` for the QR PDF generation pipeline, served from a Next.js Route Handler at `/api/admin/qr-pdf`.** Admin auth via a simple middleware check (cookie-based after initial password entry). The admin page at `/admin` is a React Server Component that shows the QR generator UI. Env vars: `ADMIN_PASSWORD`, `SHOP_IP`, `SHOP_PORT` (default 3000), `TABLE_COUNT` (default 15).

### Why PDFKit over alternatives:

- **`jspdf`** — Browser-first library. Works server-side but API is designed around browser canvas. Less natural for Node.js streaming.
- **`@react-pdf/renderer`** — React-based, heavyweight, designed for complex document layouts. Overkill for a simple grid of QR codes. Adds significant bundle size.
- **`pdfkit`** — Pure Node.js, streaming API, lightweight. Perfect for "generate images → place on pages" workflow. Built-in A4 support, image embedding from Buffer, text rendering with positioning.

## Implementation Landscape

### Key Files

- `src/app/admin/page.tsx` — **Create new.** Admin page with QR generator UI. Shows table count, SHOP_IP display, "Tạo QR Code" button. Client component that calls the API route and triggers PDF download.
- `src/app/admin/layout.tsx` — **Create new.** Admin layout with auth check. Could redirect to login if no auth cookie.
- `src/app/admin/login/page.tsx` — **Create new.** Simple login form with password field. POST to API, set cookie on success, redirect to `/admin`.
- `src/app/api/admin/login/route.ts` — **Create new.** POST handler: validate password against `ADMIN_PASSWORD` env var, set httpOnly cookie, return success/failure.
- `src/app/api/admin/qr-pdf/route.ts` — **Create new.** GET handler (auth-gated): generate QR codes for TABLE_COUNT tables, compose into A4 PDF grid using PDFKit, stream PDF as response with `Content-Disposition: attachment`.
- `src/lib/auth.ts` — **Create new.** Helper functions: `validateAdminPassword(password)`, `checkAdminCookie(request)`, `ADMIN_COOKIE_NAME` constant.
- `src/middleware.ts` — **Create new.** Next.js middleware to protect `/admin/*` routes (except `/admin/login`). Check for admin auth cookie, redirect to `/admin/login` if missing.
- `.env` — **Add env vars:** `ADMIN_PASSWORD`, `SHOP_IP`, `SHOP_PORT`, `TABLE_COUNT`.
- `package.json` — **Add dependencies:** `qrcode`, `pdfkit`, `@types/pdfkit`.

### Build Order

1. **Dependencies + env vars first** — Install `qrcode`, `pdfkit`, `@types/pdfkit`, `@types/qrcode`. Add env vars to `.env`. This unblocks all other work.
2. **Auth system** — `src/lib/auth.ts` + `src/middleware.ts` + `/api/admin/login` route + `/admin/login` page. Auth must work before the admin page can be tested.
3. **QR PDF generation API** — `/api/admin/qr-pdf/route.ts`. This is the riskiest piece (PDF generation, image embedding, layout). Build and test independently before wiring to UI.
4. **Admin page UI** — `/admin/page.tsx` with the generator button. Wire to the API route. This is the integration layer.

### Verification Approach

1. `npm run build` — succeeds with no type errors after all files added
2. `npx tsc --noEmit` — zero errors
3. Visit `/admin` without auth cookie → redirected to `/admin/login`
4. Enter wrong password → see "Sai mật khẩu" error message
5. Enter correct password → redirected to `/admin` → see QR generator page
6. Click "Tạo QR Code" → PDF downloads
7. Open PDF → contains TABLE_COUNT QR codes in grid layout, each labeled "Bàn N"
8. Each QR code encodes `http://<SHOP_IP>:<SHOP_PORT>/order?table=N`
9. Scan any QR code with phone camera → resolves to correct URL

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| QR code image generation | `qrcode` npm (soldair/node-qrcode) | Mature, 11M weekly downloads. `toBuffer()` returns PNG Buffer directly — perfect for PDFKit embedding. Supports error correction levels. |
| PDF document generation | `pdfkit` npm | Pure Node.js streaming PDF. Built-in A4 page sizing, image embedding from Buffer, text positioning. No browser deps. |
| Admin password hashing | None needed — plain comparison | Single env var password for local network. Hashing adds complexity without security benefit (attacker with env access has the hash too). |

## Constraints

- **PDF must be server-side** — Generated in a Next.js Route Handler (API route), not client-side. This is because `pdfkit` is a Node.js library.
- **No external CDN** — Both `qrcode` and `pdfkit` are pure Node.js packages. No fonts loaded from CDN (PDFKit includes Helvetica by default).
- **QR URLs must be absolute** — `http://<SHOP_IP>:<SHOP_PORT>/order?table=N`. Cannot use relative paths because QR codes are scanned from phone cameras outside the browser.
- **A4 page size** — PDFKit uses A4 (595.28 × 841.89 points) by default. Grid layout: 3 columns × 5 rows = 15 QR codes per page (fits TABLE_COUNT=15 on one page).
- **QR code size** — Each QR cell ~170×150 points. At print scale, QR code image ~120×120 points (≈4.2cm). Sufficient for reliable scanning at arm's length.
- **Next.js middleware** — Runs on Edge runtime by default. Cookie check is simple string comparison — compatible with Edge. No Prisma or Node.js-specific APIs needed in middleware.

## Common Pitfalls

- **PDFKit streaming in Next.js** — PDFKit writes to a stream. In a Route Handler, collect chunks into a Buffer then return as `new Response(buffer, { headers })`. Don't try to pipe directly to the Response — Route Handlers expect a complete Response object.
- **QR code module size** — Default `qrcode.toBuffer()` output may be small (21×21 modules). Set `width: 300` in options for a larger PNG that prints clearly.
- **Cookie security** — Use `httpOnly` and `sameSite: 'lax'` on the auth cookie. No `secure` flag needed (HTTP on local network, not HTTPS).
- **Env var validation** — If `SHOP_IP` is not set, the QR PDF route should return a clear error, not generate QR codes with "undefined" in the URL. Validate at request time, not app startup (env vars might be set after first boot).
- **Vietnamese text in PDF** — PDFKit's built-in Helvetica font does NOT support Vietnamese diacritics (ă, ơ, ư, etc.). For "Bàn N" labels, Helvetica handles "B" and "N" fine, but the "à" in "Bàn" needs a font that supports Vietnamese. Options: (a) embed a .ttf font file that supports Vietnamese, (b) use ASCII-safe labels like "Ban 1" (loses Vietnamese), or (c) use a system font. **Recommendation: embed a bundled font** — download a free Vietnamese-supporting font (e.g., Roboto, Inter, or Noto Sans) and bundle it in `public/fonts/`. PDFKit can register custom fonts via `doc.registerFont('Vietnamese', 'path/to/font.ttf')`.

## Open Risks

- **Vietnamese font in PDFKit** — Must embed a .ttf font file for Vietnamese diacritics. This adds ~100KB to the repo but is the only reliable approach. If the font file is missing or corrupt, PDF generation will fail. Mitigation: include font in repo, validate on build.
- **QR scan reliability at print size** — 4.2cm QR codes should scan fine with modern phone cameras, but older phones or poor print quality could cause issues. Error correction level 'M' (default) provides 15% recovery. Consider 'H' (30%) for extra safety at the cost of denser QR codes.

## Sources

- Prisma 7 seed configuration uses `migrations.seed` in `prisma.config.ts` — `'npx tsx prisma/seed.ts'` (source: [Prisma docs](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding))
- `qrcode` Node.js API: `QRCode.toBuffer(text, options)` returns PNG Buffer (source: [node-qrcode README](https://github.com/soldair/node-qrcode))
- PDFKit: `doc.image(buffer, x, y, {width})` embeds PNG from Buffer; `new PDFDocument({size: 'A4'})` for A4; streaming to Buffer via chunk collection (source: [PDFKit docs](https://pdfkit.org/))
- PDFKit default font (Helvetica) does NOT include Vietnamese diacritics — custom font registration required via `doc.registerFont()` (source: [PDFKit font docs](https://pdfkit.org/docs/text.html))