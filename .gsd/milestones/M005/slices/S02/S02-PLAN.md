# S02: Table Management + QR Refactor

**Goal:** Shop owner manages tables and QR codes through admin pages. Table CRUD with delete guard, QR PDF driven by live DB data.
**Demo:** Shop owner navigates to Bàn tab, adds a new table (auto-numbered 'Bàn N'). Renames a table. Attempts to delete a table with unpaid orders — sees Vietnamese error toast. Deletes an empty table. Navigates to QR Code tab, generates PDF — new table appears, deleted table is gone.

## Must-Haves

- Shop owner navigates to Bàn tab → sees table list with order counts → adds a new table (auto-named "Bàn N") → renames an existing table → attempts to delete a table with unpaid orders → sees Vietnamese error toast → deletes an empty table → navigates to QR Code tab → sees table count → taps download → PDF generates with QR codes for all current DB tables, deleted tables gone.

## Proof Level

- This slice proves: contract

## Integration Closure

S01 admin shell, AdminNav, and toast system consumed. S02 builds table and QR UI pages. QR PDF route refactored to read from DB. No downstream cross-boundary wiring remains in S02.

## Verification

- QR PDF route logs table count used in generation. Table API routes log CRUD operations.

## Tasks

- [x] **T01: Build admin tables page UI with CRUD and delete guard** `est:1h`
  Build full /admin/tables page with table list, add/rename/delete controls. Wire to GET/POST /api/admin/tables and PUT/DELETE /api/admin/tables/[id]. Handle 409 deletion guard (unpaid orders) with error toast. Use S01's toast system. Follow MenuItemForm pattern for inline rename edit.
  - Files: `src/app/admin/tables/page.tsx`, `src/app/admin/qr/page.tsx`, `src/components/admin/AdminNav.tsx`
  - Verify: vitest run — 152 existing tests pass; new table-page tests added and pass; next build succeeds

- [x] **T02: Refactor QR PDF route to use DB tables and build QR admin page** `est:1h`
  Refactor GET /api/admin/qr-pdf to query Table model from DB instead of TABLE_COUNT env var. Log table count used. Build /admin/qr page with download button and current table count. Add API tests for DB-driven QR generation and edge cases (empty DB, single table).
  - Files: `src/app/api/admin/qr-pdf/route.ts`, `src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts`, `src/app/admin/qr/page.tsx`
  - Verify: vitest run — all tests pass including new QR tests; next build succeeds

- [x] **T03: Refactor QR PDF route to use DB tables + add tests** `est:60m`
  Refactor GET /api/admin/qr-pdf to source tables from the DB instead of TABLE_COUNT env var. The route currently iterates 1..TABLE_COUNT generating QR codes sequentially. Change it to call `prisma.table.findMany({ orderBy: { number: 'asc' } })` and generate one QR per DB table record. Each QR encodes `http://${shopIp}:${shopPort}/order?table=${table.number}` (using table.number, not id). Add `import { prisma } from '@/lib/prisma'`. If zero tables exist, return 400 with error message 'Chưa có bàn nào. Hãy thêm bàn trong trang quản lý.' Keep all auth, font validation, and PDF layout logic intact. Add tests `src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts` covering: 1) unauthenticated → 401, 2) SHOP_IP missing → 400, 3) no tables in DB → 400, 4) 1 table → PDF with 1 QR, 5) multiple tables → PDF with correct count. Use `import { setupServer } from 'msw/node'` with msw handlers mocking prisma.table.findMany. Use `PDFDocument` to parse the generated PDF and verify it has correct page count and image count.
  - Files: `src/app/api/admin/qr-pdf/route.ts`, `src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts`, `src/lib/prisma.ts`
  - Verify: vitest run -- src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts && grep -c 'prisma.table.findMany' src/app/api/admin/qr-pdf/route.ts

- [x] **T04: Build admin tables page UI** `est:45m`
  Build full /admin/tables page: fetch tables via GET /api/admin/tables, show table cards with name and order count, add 'Thêm bàn' button (POST), rename inline (PATCH), two-tap delete with guard (toast.error on 409), empty-state UI. Also update /admin/qr to show QR download button.
  - Files: `src/app/admin/tables/page.tsx`, `src/app/admin/qr/page.tsx`
  - Verify: next build compiles without errors; vitest run passes

- [x] **T05: Add table management tests** `est:30m`
  Add tests for table CRUD API endpoints. Follow the pattern from existing test files. Cover GET list, POST create with auto-numbering, PATCH rename, DELETE with guard, DELETE empty. Minimum 10 tests.
  - Files: `src/app/api/admin/tables/__tests__/table-crud.test.ts`
  - Verify: vitest run — all tests pass (152+ total)

## Files Likely Touched

- src/app/admin/tables/page.tsx
- src/app/admin/qr/page.tsx
- src/components/admin/AdminNav.tsx
- src/app/api/admin/qr-pdf/route.ts
- src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts
- src/lib/prisma.ts
- src/app/api/admin/tables/__tests__/table-crud.test.ts
