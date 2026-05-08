---
id: S01
parent: M005
milestone: M005
provides:
  - ["Admin dashboard shell with 3-tab navigation (Thực đơn, Bàn, QR Code)", "Toast notification infrastructure usable by all subsequent slices", "Hidden field on MenuItem with migration applied", "Menu CRUD API surface at /api/admin/menu", "AdminNav component for admin layout"]
requires:
  []
affects:
  - ["S02 — Table Management + QR Refactor: uses admin shell, AdminNav, toast system", "S03 — Skeleton Loaders: needs to add skeletons to admin menu page", "S04 — Deployment Readiness: must include admin routes in deployment verification"]
key_files:
  - ["prisma/migrations/20260506090234_add_menu_hidden/migration.sql", "src/components/ui/Toast.tsx", "src/components/ui/ToastProvider.tsx", "src/components/admin/AdminNav.tsx", "src/components/admin/MenuItemForm.tsx", "src/app/admin/layout.tsx", "src/app/admin/page.tsx", "src/app/admin/menu/page.tsx", "src/app/api/admin/menu/route.ts", "src/app/api/admin/menu/[id]/route.ts", "src/app/api/admin/menu/__tests__/menu-crud.test.ts", "src/lib/__tests__/hidden-menu-filter.test.ts"]
key_decisions:
  - ["Soft-delete via hidden Boolean flag preserves OrderItem FK references — no hard deletes", "Toast portal at z-60 above CartSheet (z-50) and modals — ToastProvider in root layout", "AdminNav replicates StaffNav bottom-tab pattern for UX consistency", "Two-tap delete reuses BillView's 3-second auto-reset pattern", "Hidden item check runs before unavailable check in order route (400 vs 409)", "DELETE endpoint is soft-delete only — sets hidden=true", "Staggered card animations via CSS @keyframes with inline delay — no JS animation library"]
patterns_established:
  - ["Portal-based toast system available globally via useToast() hook", "Admin route convention: /admin/* pages, /api/admin/* APIs, middleware-protected", "Two-tap destructive action pattern reused across staff and admin pages", "Hidden-item soft-delete with customer/staff/order filtering chain", "Slide-up modal form pattern (MenuItemForm) following MenuPickerModal animation style"]
observability_surfaces:
  - none
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-05-06T09:18:35.747Z
blocker_discovered: false
---

# S01: Admin Menu Management

**Delivered admin dashboard shell with tabbed navigation, full menu CRUD (create, edit, toggle availability, soft-delete, restore), portal-based toast notifications, hidden-item filtering across all customer/staff surfaces, and 41 new tests (152 total).**

## What Happened

## What This Slice Built

S01 establishes the admin dashboard foundation and delivers complete menu item lifecycle management — the first half of the M005 "Admin & Polish" milestone.

### Schema Migration (T01)
Added `hidden Boolean @default(false)` to MenuItem model. Migration `20260506090234_add_menu_hidden` uses SQLite's table-recreation approach (PRAGMA defer_foreign_keys) to safely add the column. All existing records receive `hidden=false`. This soft-delete strategy preserves OrderItem FK references — no cascade deletes needed.

### Toast Notification Infrastructure (T01)
Created a portal-based toast system at z-60 (above CartSheet z-50 and modals). `ToastProvider` wraps root layout, exposing `useToast()` hook with `toast.success(msg)` and `toast.error(msg)` methods. Auto-dismiss after 3 seconds with CSS enter/exit animations. Green for success, red for error. Available on all pages — admin, staff, and customer.

### Admin Dashboard Shell (T01)
Built `/admin` with 3-tab bottom navigation (Thực đơn, Bàn, QR Code) plus logout link. `AdminNav` replicates `StaffNav` fixed bottom tab pattern for UX consistency. `/admin` redirects server-side to `/admin/menu`. Stub pages created for `/admin/tables` and `/admin/qr` (to be implemented in S02).

### Menu CRUD API (T02)
Five endpoints under `/api/admin/menu`:
- **GET** — Returns all menu items including hidden, ordered by sortOrder
- **POST** — Creates with validation (name required, price > 0, category DRINK|FOOD). Vietnamese error messages.
- **PUT /[id]** — Full field update with per-field validation
- **PATCH /[id]** — Toggle `available` or `hidden` boolean fields
- **DELETE /[id]** — Soft-delete (sets hidden=true), not hard delete

Auth handled by existing middleware on `/api/admin/*` — no explicit auth in routes.

### Hidden-Item Filtering (T02)
Three critical filtering updates:
1. Customer `/order` page: `where: { hidden: false }` — customers never see hidden items
2. Staff `/api/staff/menu`: `where: { hidden: false }` — staff add-item modal excludes hidden items
3. `POST /api/order`: Rejects hidden items with 400 'Món này không còn trong thực đơn' — runs before unavailable check (hidden=400 vs unavailable=409)

### Admin Menu Page UI (T03)
Full menu management page at `/admin/menu`:
- Category tabs (DRINK/FOOD) with non-hidden item counts
- Item cards with name, description, price (tabular-nums), sortOrder badge, availability/hidden badges
- Hidden items sorted to bottom at 55% opacity with 'Đã ẩn' badge
- Create/edit via slide-up modal (MenuItemForm) reusing MenuPickerModal animation pattern
- Toggle availability: PATCH available flag, button flips between 'Hết hàng'/'Còn hàng'
- Two-tap soft-delete: reuses BillView's 3-second auto-reset pattern
- Restore hidden items: green button with undo arrow
- All operations trigger Vietnamese toast feedback
- Staggered card enter animations via CSS @keyframes (50ms × index delay)
- Amber/warm palette, 44px+ touch targets, active:scale-[0.96] on interactive elements

### Test Coverage (T04)
41 new tests across 2 files:
- `menu-crud.test.ts` (31 tests): All 5 HTTP methods with happy-path and error cases
- `hidden-menu-filter.test.ts` (10 tests): Filtering across customer, staff, and order surfaces; hidden-before-unavailable precedence check
Total: 152 tests (up from 111), all passing.

## Verification

**All slice-level verification checks pass:**

1. **vitest run**: 152 tests pass across 10 test files (111 original + 41 new). Exit code 0. Duration ~900ms.
2. **next build**: Compiled successfully with Turbopack. TypeScript checks pass. All 22+ routes generated including new /admin/menu, /admin/qr, /admin/tables, /api/admin/menu routes. Exit code 0.
3. **Key files**: All 14 expected files exist on disk — migration SQL, Toast components, AdminNav, admin pages, API routes, MenuItemForm, and test files.
4. **Schema integrity**: Migration applied, hidden field defaults to false, preserving all existing data.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

The hidden field was already present in schema.prisma from planning — only the migration generation and application were needed. Test count exceeded the 125+ target, landing at 152 (41 new tests).

## Known Limitations

No concurrent editing protection (last write wins). No optimistic UI updates — admin page refetches full list after each mutation. Stub pages for /admin/tables and /admin/qr are placeholders pending S02.

## Follow-ups

None — all slice plan must-haves delivered. S02 will build on the admin shell and toast system.

## Files Created/Modified

- `prisma/schema.prisma` — Added hidden Boolean @default(false) to MenuItem model
- `prisma/migrations/20260506090234_add_menu_hidden/migration.sql` — SQLite migration adding hidden column to menu_items table
- `src/components/ui/Toast.tsx` — Portal-based toast component with success/error variants, 3s auto-dismiss
- `src/components/ui/ToastProvider.tsx` — React context provider for toast system with useToast() hook
- `src/app/layout.tsx` — Wrapped root layout with ToastProvider
- `src/components/admin/AdminNav.tsx` — Bottom-fixed 3-tab navigation for admin dashboard
- `src/app/admin/layout.tsx` — Admin layout with AdminNav and padding
- `src/app/admin/page.tsx` — Server-side redirect from /admin to /admin/menu
- `src/app/admin/menu/page.tsx` — Full menu management page with CRUD, category tabs, cards, animations
- `src/app/admin/tables/page.tsx` — Stub page for table management (S02 scope)
- `src/app/admin/qr/page.tsx` — Stub page for QR management (S02 scope)
- `src/components/admin/MenuItemForm.tsx` — Slide-up modal form for create/edit menu items
- `src/app/api/admin/menu/route.ts` — GET (list all) and POST (create) admin menu API
- `src/app/api/admin/menu/[id]/route.ts` — PUT (update), PATCH (toggle), DELETE (soft-delete) admin menu API
- `src/app/order/page.tsx` — Added hidden:false filter to customer menu query
- `src/app/api/staff/menu/route.ts` — Added hidden:false filter to staff menu query
- `src/app/api/order/route.ts` — Added hidden item rejection before unavailable check
- `src/app/globals.css` — Added adminCardEnter keyframes for staggered card animations
- `src/app/api/admin/menu/__tests__/menu-crud.test.ts` — 31 tests for admin menu CRUD API routes
- `src/lib/__tests__/hidden-menu-filter.test.ts` — 10 tests for hidden-item filtering across surfaces
