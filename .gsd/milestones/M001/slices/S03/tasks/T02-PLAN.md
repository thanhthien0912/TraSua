---
estimated_steps: 31
estimated_files: 1
skills_used: []
---

# T02: Build QR PDF generation API route with pdfkit and qrcode at /api/admin/qr-pdf

Create the core API route that generates a downloadable A4 PDF containing a grid of QR codes for all tables. This is the primary deliverable of the slice and the riskiest technical piece — PDFKit streaming in Next.js Route Handlers has specific patterns.

## Steps

1. Create `src/app/api/admin/qr-pdf/route.ts` with a GET handler
2. Check admin auth by importing `checkAdminCookie` from `@/lib/auth` and reading the cookie header from the request. Return 401 JSON error if not authenticated.
3. Read and validate env vars: `SHOP_IP` (REQUIRED — if missing, return 400 with message 'SHOP_IP chưa được cấu hình'), `SHOP_PORT` (default '3000'), `TABLE_COUNT` (default '15', parse to int)
4. Generate QR codes: for each table n from 1 to TABLE_COUNT, use `QRCode.toBuffer(url, { width: 300, errorCorrectionLevel: 'M' })` to create a PNG buffer. URL format: `http://${SHOP_IP}:${SHOP_PORT}/order?table=${n}`
5. Create PDFKit document: `new PDFDocument({ size: 'A4', margin: 40 })`. Register the Vietnamese font: `doc.registerFont('Vietnamese', path.join(process.cwd(), 'public', 'fonts', '<fontfile>.ttf'))`. Use the font filename that T01 actually placed there — likely Inter.ttf or similar.
6. Layout QR codes in a 3-column × 5-row grid per page. Page dimensions: 595.28 × 841.89 points, margin 40pt. Available width ~515pt, column width ~170pt. For each cell: embed QR image at ~120×120pt centered in column, add 'Bàn N' label below in Vietnamese font (14pt, centered), add small subtitle 'Quét để đặt món' (10pt, lighter color). After every 15 items (3×5), call doc.addPage() for the next batch.
7. **Critical PDFKit streaming pattern for Next.js**: Do NOT try to pipe PDFKit output to the Response. Instead: create an array `const chunks: Buffer[] = []`, listen to `doc.on('data', chunk => chunks.push(chunk))`, create a Promise that resolves on `doc.on('end', ...)`, call `doc.end()`, await the promise, concatenate with `Buffer.concat(chunks)`, then return `new Response(buffer, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="trasua-qr-codes.pdf"' } })`
8. Add a title at the top of the first page: 'QR Code - TraSua' in Vietnamese font (20pt, bold)

## Must-Haves

- GET handler with auth check (401 if no cookie)
- Env var validation — SHOP_IP required, clear Vietnamese error if missing
- QR codes encode absolute URL: http://SHOP_IP:SHOP_PORT/order?table=N
- A4 PDF with 3×5 grid (15 QR codes per page)
- Vietnamese font used for 'Bàn N' labels (not Helvetica)
- PDF returned as downloadable attachment
- Handles TABLE_COUNT > 15 with pagination (new pages)
- npx tsc --noEmit zero errors
- npm run build succeeds

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Font file (public/fonts/) | Return 500 with 'Font file not found' message | N/A (filesystem) | N/A |
| qrcode.toBuffer() | Catch and return 500 with error message | N/A (CPU-bound) | N/A |
| PDFKit doc creation | Catch and return 500 | N/A | N/A |
| Env vars (SHOP_IP) | Return 400 'SHOP_IP chưa được cấu hình' | N/A | N/A |

## Negative Tests

- Missing SHOP_IP env var → 400 error, not a broken PDF with 'undefined' in URLs
- TABLE_COUNT=0 → empty PDF or appropriate error
- Unauthenticated request → 401, not PDF

## Inputs

- ``src/lib/auth.ts` — checkAdminCookie function for auth gating`
- ``public/fonts/Inter.ttf` — Vietnamese TTF font for PDF rendering`
- ``.env` — SHOP_IP, SHOP_PORT, TABLE_COUNT env vars`

## Expected Output

- ``src/app/api/admin/qr-pdf/route.ts` — GET handler generating A4 PDF with QR code grid`

## Verification

npx tsc --noEmit && npm run build && grep -q 'PDFDocument\|pdfkit' src/app/api/admin/qr-pdf/route.ts && grep -q 'order?table=' src/app/api/admin/qr-pdf/route.ts
