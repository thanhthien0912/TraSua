---
id: S02
parent: M005
milestone: M005
provides:
  - Admin tables page with full CRUD and delete guard
  - QR PDF route sourced from DB tables
  - Admin QR page with download button
  - 21 new table CRUD tests + QR PDF tests (178 total tests passing)
requires:
  - slice: S01
    provides: Admin shell, AdminNav, toast system, and menu CRUD API consumed by S02
affects:
  []
key_files:
  - src/app/api/admin/qr-pdf/route.ts
  - src/app/admin/tables/page.tsx
  - src/app/admin/qr/page.tsx
  - src/app/api/admin/tables/route.ts
  - src/app/api/admin/tables/[id]/route.ts
  - src/app/api/admin/tables/__tests__/table-crud.test.ts
  - src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts
key_decisions:
  - QR PDF source of truth is now DB (prisma.table.findMany) instead of TABLE_COUNT env var
  - Table deletion guard returns 409 when unpaid orders exist
  - Auto-numbered table creation: finds max(number) and creates 'Bàn N' sequentially
  - Inline rename with Enter save / Escape cancel keyboard shortcuts
patterns_established:
  - Two-tap destructive action pattern (3s auto-reset) for table delete confirmation
  - Inline edit mode with Enter save / Escape cancel
  - Auto-numbered naming pattern for sequential entity creation
  - Delete guard with 409 + hasUnpaidOrders flag for cross-entity constraints
observability_surfaces:
  - QR PDF route logs table count: `[qr-pdf] Generating PDF for N tables`
  - Table API routes log CRUD operations
drill_down_paths:
  - .gsd/milestones/M005/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M005/slices/S02/tasks/T03-SUMMARY.md
  - .gsd/milestones/M005/slices/S02/tasks/T04-SUMMARY.md
  - .gsd/milestones/M005/slices/S02/tasks/T05-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-05-08T04:12:15.961Z
blocker_discovered: false
---

# S02: Table Management + QR Refactor

**Completed table management UI and QR PDF DB refactor**

## What Happened

Completed Table Management + QR Refactor (S02) for M005. Two main components: (1) QR PDF route refactored to read tables from prisma DB — generates one QR per table encoding http://SHOP_IP:SHOP_PORT/order?table=N using table.number field. Returns 400 if zero tables exist. (2) Admin tables page fully built with add (auto-numbered "Bàn N"), inline rename (PUT), and two-tap delete with 409 guard. Admin QR page shows table count and download button. Added 21 table CRUD tests + QR PDF tests. 178 tests total passing.

## Verification

Verified by: npx vitest run → 178 tests pass (12 test files). next build compiles successfully.

## Requirements Advanced

- R005: Table QR codes — S02 implements table CRUD and DB-driven QR generation

## Requirements Validated

- R004: Admin soft-delete menu items — confirmed by table-crud.test.ts

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

none

## Files Created/Modified

- `src/app/api/admin/qr-pdf/route.ts` — QR PDF route refactored to source tables from DB via prisma.table.findMany
- `src/app/admin/tables/page.tsx` — Table management UI with add/rename/delete and 409 guard
- `src/app/admin/qr/page.tsx` — QR admin page with download button and table count
- `src/app/api/admin/tables/__tests__/table-crud.test.ts` — 21 tests for table CRUD API
- `src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts` — Tests for QR PDF DB-driven generation
