---
id: T02
parent: S03
milestone: M001
key_files:
  - src/app/api/admin/qr-pdf/route.ts
key_decisions:
  - Used buffer-collection pattern for PDFKit streaming in Next.js (chunks array + end promise) instead of pipe — pipe is incompatible with Response constructor
  - Set runtime='nodejs' explicitly since pdfkit requires Node.js Buffer/fs APIs unavailable in Edge runtime
  - TABLE_COUNT=0 returns 400 error rather than generating empty PDF — better UX for misconfiguration
duration: 
verification_result: passed
completed_at: 2026-05-06T03:30:17.250Z
blocker_discovered: false
---

# T02: Built GET /api/admin/qr-pdf route that generates A4 PDF with 3×5 QR code grid per page, Vietnamese labels via Inter font, admin cookie auth, and env var validation

**Built GET /api/admin/qr-pdf route that generates A4 PDF with 3×5 QR code grid per page, Vietnamese labels via Inter font, admin cookie auth, and env var validation**

## What Happened

Created the core QR PDF generation API route at `src/app/api/admin/qr-pdf/route.ts`. The handler:\n\n1. **Auth gate** — reads Cookie header and validates via `checkAdminCookie()`, returning 401 if unauthenticated.\n2. **Env var validation** — SHOP_IP is required (returns 400 with Vietnamese error if missing), SHOP_PORT defaults to 3000, TABLE_COUNT defaults to 15. Zero TABLE_COUNT returns 400.\n3. **Font validation** — checks `public/fonts/Inter.ttf` exists before attempting PDF generation, returns 500 if missing.\n4. **QR generation** — loops 1..TABLE_COUNT, generating 300px PNG buffers via `QRCode.toBuffer()` encoding `http://SHOP_IP:SHOP_PORT/order?table=N`.\n5. **PDF layout** — A4 pages (595.28×841.89pt, 40pt margin) with 3-column × 5-row grid. Each cell has centered 120×120pt QR image, "Bàn N" label (14pt Vietnamese font), and "Quét để đặt món" subtitle (10pt lighter). Title "QR Code - TraSua" on first page. Pagination via `doc.addPage()` every 15 tables.\n6. **Streaming pattern** — uses buffer-collection approach (chunks array + end promise) instead of pipe, which is incompatible with Next.js Response constructor. Returns as `attachment; filename="trasua-qr-codes.pdf"`.\n\nExplicitly set `runtime = "nodejs"` since pdfkit requires Node.js Buffer/fs APIs. All failure modes from the plan are handled with appropriate status codes and error messages.

## Verification

- `npx tsc --noEmit` — zero errors (5.2s)\n- `npm run build` — compiled successfully, route shows as dynamic (ƒ) at /api/admin/qr-pdf (8.4s)\n- `grep -q 'PDFDocument|pdfkit'` — confirmed pdfkit usage in route\n- `grep -q 'order?table='` — confirmed QR URL format in route

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 5200ms |
| 2 | `npm run build` | 0 | ✅ pass | 8400ms |
| 3 | `grep -q 'PDFDocument|pdfkit' src/app/api/admin/qr-pdf/route.ts` | 0 | ✅ pass | 50ms |
| 4 | `grep -q 'order?table=' src/app/api/admin/qr-pdf/route.ts` | 0 | ✅ pass | 50ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/app/api/admin/qr-pdf/route.ts`
