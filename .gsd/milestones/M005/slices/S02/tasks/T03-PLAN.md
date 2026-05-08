---
estimated_steps: 3
estimated_files: 3
skills_used: []
---

# T03: Refactor QR PDF route to use DB tables + add tests

Refactor GET /api/admin/qr-pdf to source tables from the DB instead of TABLE_COUNT env var. The route currently iterates 1..TABLE_COUNT generating QR codes sequentially. Change it to call `prisma.table.findMany({ orderBy: { number: 'asc' } })` and generate one QR per DB table record. Each QR encodes `http://${shopIp}:${shopPort}/order?table=${table.number}` (using table.number, not id). Add `import { prisma } from '@/lib/prisma'`. If zero tables exist, return 400 with error message 'Chưa có bàn nào. Hãy thêm bàn trong trang quản lý.' Keep all auth, font validation, and PDF layout logic intact. Add tests `src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts` covering: 1) unauthenticated → 401, 2) SHOP_IP missing → 400, 3) no tables in DB → 400, 4) 1 table → PDF with 1 QR, 5) multiple tables → PDF with correct count. Use `import { setupServer } from 'msw/node'` with msw handlers mocking prisma.table.findMany. Use `PDFDocument` to parse the generated PDF and verify it has correct page count and image count.

**Files:** src/app/api/admin/qr-pdf/route.ts, src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts, src/lib/prisma.ts

**Verification:** vitest run -- src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts && grep -c 'prisma.table.findMany' src/app/api/admin/qr-pdf/route.ts

## Inputs

- `prisma schema with Table model`

## Expected Output

- `src/app/api/admin/qr-pdf/route.ts`
- `src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts`

## Verification

vitest run -- src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts && grep -c 'prisma.table.findMany' src/app/api/admin/qr-pdf/route.ts
