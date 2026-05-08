---
id: M005
title: "Admin & Polish"
status: complete
completed_at: 2026-05-08T04:22:33.352Z
key_decisions:
  - Soft-delete via hidden Boolean flag preserves OrderItem FK references — no hard deletes
  - Toast portal at z-60 above CartSheet (z-50) and modals
  - QR PDF source of truth is DB (prisma.table.findMany) — TABLE_COUNT env var deprecated
  - Table deletion guard returns 409 with hasUnpaidOrders flag
  - Skeleton.tsx CSS-based shimmer animation in amber/cream palette (no JS library)
  - Startup scripts validate ADMIN_PASSWORD and SHOP_IP before starting app
  - All error/toast/success messages in Vietnamese
key_files:
  - prisma/schema.prisma
  - prisma/migrations/20260506090234_add_menu_hidden/migration.sql
  - src/components/ui/Toast.tsx
  - src/components/ui/ToastProvider.tsx
  - src/components/ui/Skeleton.tsx
  - src/components/admin/AdminNav.tsx
  - src/app/admin/menu/page.tsx
  - src/app/admin/tables/page.tsx
  - src/app/admin/qr/page.tsx
  - src/app/api/admin/menu/route.ts
  - src/app/api/admin/menu/[id]/route.ts
  - src/app/api/admin/tables/route.ts
  - src/app/api/admin/tables/[id]/route.ts
  - src/app/api/admin/qr-pdf/route.ts
  - start.bat
  - start.sh
  - README.md
lessons_learned:
  - Batch script parsing .env with for /f and findstr works reliably on Windows
  - CSS shimmer skeleton animations provide better UX than spinner-only states
  - Two-tap destructive action pattern (3s auto-reset) is consistent and intuitive
  - Soft-delete (hidden flag) preserves FK integrity and allows easy restore
  - DB-driven QR generation (prisma.table.findMany) is more maintainable than TABLE_COUNT env var
---

# M005: Admin & Polish

**M005 Admin & Polish complete — admin dashboard, tables, QR, skeletons, error states, startup scripts, Vietnamese README**

## What Happened

Completed M005 Admin & Polish milestone — transformed TraSua from developer prototype to deployable shop system. Delivered: (1) Admin dashboard with tabbed navigation and logout — S01 established admin shell, menu CRUD, toast system, hidden field with 41 tests. (2) Table management with add/rename/delete and 409 guard for unpaid orders + QR PDF refactored to DB — S02 added 21 table tests (178 total). (3) Skeleton loaders and error states — S03 added Skeleton.tsx component library with CSS shimmer animations in amber/cream palette. (4) Deployment readiness — S04 added start.bat/start.sh with env validation and comprehensive Vietnamese README. 178 tests pass, build succeeds.

## Success Criteria Results

- [✅] Create menu item → customer sees it → staff receives it (hidden:false filter chain)
- [✅] Soft-delete item → gone from customer, grayed in admin, order history preserved (hidden flag + filter chain)
- [✅] Add table → QR PDF shows new table (prisma.table.findMany source of truth)
- [✅] Delete table with unpaid orders → error toast (409 guard)
- [✅] Skeleton loaders during data fetch (Skeleton.tsx applied)
- [✅] Toast feedback on all CRUD operations (ToastProvider + useToast)
- [✅] ADMIN_PASSWORD validated on boot → Vietnamese error if missing (start.bat/start.sh)
- [✅] start.bat/start.sh starts app, Vietnamese README guides non-developer
- [✅] 178 tests pass (original 111 + 67 new across S01-S04)

## Definition of Done Results

- [✅] Admin dashboard with tabbed navigation (Thực đơn, Bàn, QR Code) — S01 AdminNav + layout
- [✅] Menu CRUD with hidden field and soft-delete — S01 API + page + 41 new tests
- [✅] Table management with add/rename/delete + 409 guard — S02 page + API
- [✅] QR PDF from DB (not TABLE_COUNT env var) — S02 route refactored
- [✅] Skeleton loaders during data fetch — S03 Skeleton.tsx applied to all admin/staff pages
- [✅] Toast feedback on all CRUD operations — S01 ToastProvider + useToast
- [✅] Error states with retry buttons — S03 admin tables + staff checkout
- [✅] Startup scripts with env validation — S04 start.bat + start.sh
- [✅] Vietnamese README with full setup guide — S04 README.md
- [✅] 178 tests pass (111 original + 67 new)

## Requirement Outcomes

| Requirement | Status | Evidence |
|-------------|--------|----------|
| R004: Admin soft-delete menu items | ✅ Validated | menu-crud.test.ts (31 tests), hidden-menu-filter.test.ts (10 tests) |
| R005: Table QR codes | ✅ Validated | qr-pdf.test.ts tests DB source, table-crud.test.ts (21 tests) |
| R006: Toast feedback | ✅ Validated | Toast.tsx + ToastProvider used by all admin/staff pages |
| R007: Menu CRUD API | ✅ Validated | 31 menu CRUD tests pass |
| R008: Deployment scripts | ✅ Validated | start.bat, start.sh, README.md exist and valid |
| R009: Skeleton loaders | ✅ Validated | Skeleton.tsx applied to admin menu, tables, QR, checkout |
| R010: Error states | ✅ Validated | Error states in admin tables, staff checkout with retry |
| R011: Documentation | ✅ Validated | Vietnamese README with full setup guide |

## Deviations

None — all plan items delivered. Test count exceeded target (178 vs planned 152+).

## Follow-ups

none
