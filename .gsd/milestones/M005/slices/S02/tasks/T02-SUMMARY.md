---
id: T02
parent: S02
milestone: M005
key_files:
  - src/app/api/admin/qr-pdf/route.ts
  - src/app/admin/qr/page.tsx
key_decisions:
  - QR PDF refactored to use prisma.table.findMany instead of TABLE_COUNT env var
  - Each QR encodes http://SHOP_IP:SHOP_PORT/order?table=TABLE_NUMBER using table.number field
  - Returns 400 'Chưa có bàn nào' if no tables in DB
  - Table count logged for observability
duration: 
verification_result: passed
completed_at: 2026-05-08T04:11:08.644Z
blocker_discovered: false
---

# T02: Refactored QR PDF to use DB tables and built QR admin page

**Refactored QR PDF to use DB tables and built QR admin page**

## What Happened

Refactored QR PDF route to query Table model from DB. Added prisma import and prisma.table.findMany call. Route logs table count. Admin QR page shows table count and download button.

## Verification

npx vitest run → 178 tests pass; grep -c 'prisma.table.findMany' src/app/api/admin/qr-pdf/route.ts returns 1

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run` | 0 | ✅ pass | 1100ms |
| 2 | `grep -c 'prisma.table.findMany' src/app/api/admin/qr-pdf/route.ts` | 0 | ✅ pass | 100ms |

## Deviations

None

## Known Issues

None

## Files Created/Modified

- `src/app/api/admin/qr-pdf/route.ts`
- `src/app/admin/qr/page.tsx`
