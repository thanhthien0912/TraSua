---
id: T01
parent: S01
milestone: M002
key_files:
  - src/lib/format.ts
  - src/app/order/page.tsx
  - src/components/order/ErrorPage.tsx
key_decisions:
  - Order page renders inline error component rather than redirecting — dead-end prevents ordering without valid table QR
  - Menu items serialized to plain objects at server boundary — strips Prisma class metadata for clean client component props
  - Placeholder text with item count rendered until MenuView client component is built in T02
duration: 
verification_result: passed
completed_at: 2026-05-06T04:12:45.823Z
blocker_discovered: false
---

# T01: Created VND price formatter, /order Server Component with table validation, and Vietnamese error page

**Created VND price formatter, /order Server Component with table validation, and Vietnamese error page**

## What Happened

Created three files to establish the customer-facing order page foundation:

1. **`src/lib/format.ts`** — `formatVND()` utility using `Intl.NumberFormat('vi-VN')` to produce '45,000đ' format. Uses a module-level formatter instance for efficiency.

2. **`src/app/order/page.tsx`** — Async Server Component that correctly awaits `searchParams` (Next.js 16 Promise-based API). Validates the `table` query param: must be a string, must parse to a number, and that number must exist in the DB via `prisma.table.findFirst()`. Invalid/missing tables render the ErrorPage component. Valid tables fetch all menu items sorted by `sortOrder`, serialize them as plain objects (stripping Prisma class metadata for the client component boundary), and render a placeholder with item count while the MenuView client component (T02) is built.

3. **`src/components/order/ErrorPage.tsx`** — Full-screen Vietnamese error page with amber branding, warning icon, descriptive message, and subtle TraSua branding footer. Dead-end by design — no navigation links to prevent ordering without a valid table.

All three scenarios verified in browser: `/order?table=99` (nonexistent table) → error page, `/order` (missing param) → error page, `/order?table=5` (valid table) → renders "Bàn 5" header with 18 menu items from seeded DB.

## Verification

**`next build`** — Compiled successfully, TypeScript passed, `/order` route generated as dynamic (ƒ).

**Browser verification** (3 scenarios):
- `/order?table=99` → Vietnamese error page with "Không tìm thấy bàn" heading and correct message ✅
- `/order` (no param) → Same error page ✅
- `/order?table=5` → "Bàn 5" header, "Đang tải thực đơn… (18 món)" placeholder, no console errors, no failed requests ✅

**Browser assertions** — 4/4 passed: text "Bàn 5" visible, text "18 món" visible, no console errors, no failed requests.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx next build` | 0 | ✅ pass | 8300ms |
| 2 | `browser: /order?table=99 → error page` | 0 | ✅ pass | 2000ms |
| 3 | `browser: /order → error page` | 0 | ✅ pass | 1500ms |
| 4 | `browser: /order?table=5 → renders Bàn 5 with 18 items` | 0 | ✅ pass | 2000ms |
| 5 | `browser_assert: text+error checks (4/4)` | 0 | ✅ pass | 500ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/lib/format.ts`
- `src/app/order/page.tsx`
- `src/components/order/ErrorPage.tsx`
