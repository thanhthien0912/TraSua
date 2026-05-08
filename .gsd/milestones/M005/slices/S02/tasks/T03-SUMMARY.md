---
id: T03
parent: S02
milestone: M005
key_files:
  - src/app/api/admin/qr-pdf/route.ts
  - src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts
key_decisions:
  - QR PDF route reads from DB via prisma.table.findMany
  - Tests exist in src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts
duration: 
verification_result: passed
completed_at: 2026-05-08T04:11:33.081Z
blocker_discovered: false
---

# T03: QR PDF route uses DB tables with tests

**QR PDF route uses DB tables with tests**

## What Happened

QR PDF tests already present on disk. Route refactored to use DB tables. Tests verify unauthenticated→401, SHOP_IP missing→400, no tables→400, PDF generation with correct count.

## Verification

npx vitest run -- src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts passes

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run` | 0 | ✅ pass | 1100ms |

## Deviations

None

## Known Issues

None

## Files Created/Modified

- `src/app/api/admin/qr-pdf/route.ts`
- `src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts`
