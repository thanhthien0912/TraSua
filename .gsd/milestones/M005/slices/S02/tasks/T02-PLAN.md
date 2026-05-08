---
estimated_steps: 3
estimated_files: 3
skills_used: []
---

# T02: Refactor QR PDF route to use DB tables and build QR admin page

Refactor GET /api/admin/qr-pdf to query Table model from DB instead of TABLE_COUNT env var. Log table count used. Build /admin/qr page with download button and current table count. Add API tests for DB-driven QR generation and edge cases (empty DB, single table).

**Files:** src/app/api/admin/qr-pdf/route.ts, src/app/admin/qr/page.tsx

**Verification:** vitest run — all tests pass including new QR tests; next build succeeds with qr-pdf route working from DB

## Inputs

- `prisma schema with Table model`

## Expected Output

- `src/app/api/admin/qr-pdf/route.ts`
- `src/app/admin/qr/page.tsx`
- `src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts`

## Verification

vitest run — all tests pass including new QR tests; next build succeeds
