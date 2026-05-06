---
id: T01
parent: S01
milestone: M005
key_files:
  - prisma/migrations/20260506090234_add_menu_hidden/migration.sql
  - src/components/ui/Toast.tsx
  - src/components/ui/ToastProvider.tsx
  - src/components/admin/AdminNav.tsx
  - src/app/admin/layout.tsx
  - src/app/admin/page.tsx
  - src/app/admin/menu/page.tsx
  - src/app/admin/tables/page.tsx
  - src/app/admin/qr/page.tsx
  - src/app/layout.tsx
key_decisions:
  - Toast uses portal to document.body with z-60 to clear CartSheet (z-50) and modals
  - AdminNav replicates StaffNav pattern exactly for UX consistency, adds logout link as 4th item
  - Admin page redirects to /admin/menu using next/navigation redirect() server-side
duration: 
verification_result: passed
completed_at: 2026-05-06T09:04:46.225Z
blocker_discovered: false
---

# T01: Added hidden field to MenuItem, created portal-based Toast system, and built admin tabbed layout shell with 3 stub pages.

**Added hidden field to MenuItem, created portal-based Toast system, and built admin tabbed layout shell with 3 stub pages.**

## What Happened

Executed schema migration, toast component, and admin layout shell in sequence:

**Schema migration:** The `hidden Boolean @default(false)` field was already present in schema.prisma (added during planning). Generated and applied migration `20260506090234_add_menu_hidden` which recreates the menu_items table with the new column — all existing records receive `hidden=false` by default. SQLite's table-recreation approach (PRAGMA defer_foreign_keys) ensures data integrity.

**Toast component:** Created `src/components/ui/Toast.tsx` as a portal-based slide-in toast rendered at the bottom of the screen. Uses `createPortal` to document.body with z-index 60 (above CartSheet at z-50). Green variant for success, red for error, auto-dismiss after 3s with enter/exit animations. Created `src/components/ui/ToastProvider.tsx` with React context exposing `useToast()` hook with `toast.success(msg)` and `toast.error(msg)` methods. Wrapped root layout with `<ToastProvider>` so toast is available on all pages.

**Admin layout + navigation:** Created `src/components/admin/AdminNav.tsx` replicating StaffNav's fixed bottom tab pattern with 3 tabs (Thực đơn /admin/menu, Bàn /admin/tables, QR Code /admin/qr) plus a logout link. Created `src/app/admin/layout.tsx` wrapping children with pb-20 padding + AdminNav. Replaced the existing QR-only admin page with a server-side redirect to /admin/menu. Created stub pages for all 3 admin routes with placeholder content.

## Verification

Ran `npx vitest run` — all 111 tests pass across 8 test files. Ran `npx next build` — compiled successfully with Turbopack, TypeScript checks pass, all 22 routes generated including new /admin/menu, /admin/qr, /admin/tables routes.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run` | 0 | ✅ pass | 12600ms |
| 2 | `npx next build` | 0 | ✅ pass | 12600ms |

## Deviations

The hidden field was already present in schema.prisma from planning — only the migration needed to be generated and applied.

## Known Issues

None.

## Files Created/Modified

- `prisma/migrations/20260506090234_add_menu_hidden/migration.sql`
- `src/components/ui/Toast.tsx`
- `src/components/ui/ToastProvider.tsx`
- `src/components/admin/AdminNav.tsx`
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/menu/page.tsx`
- `src/app/admin/tables/page.tsx`
- `src/app/admin/qr/page.tsx`
- `src/app/layout.tsx`
