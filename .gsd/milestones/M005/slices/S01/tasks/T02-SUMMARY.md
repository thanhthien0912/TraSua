---
id: T02
parent: S01
milestone: M005
key_files:
  - src/app/api/admin/menu/route.ts
  - src/app/api/admin/menu/[id]/route.ts
  - src/app/api/order/route.ts
  - src/app/api/staff/menu/route.ts
  - src/app/order/page.tsx
  - prisma/schema.prisma
key_decisions:
  - Middleware handles auth for /api/admin/* — no explicit checkAdminCookie() in route handlers
  - Hidden item check runs before unavailable check in order route — hidden items get a distinct 400 error vs 409 for unavailable
  - DELETE is soft-delete only (sets hidden=true) — no hard delete to preserve order history referential integrity
duration: 
verification_result: passed
completed_at: 2026-05-06T09:03:53.467Z
blocker_discovered: false
---

# T02: Created admin menu CRUD API routes (GET/POST/PUT/PATCH/DELETE) and added hidden-item filtering to customer and staff routes.

**Created admin menu CRUD API routes (GET/POST/PUT/PATCH/DELETE) and added hidden-item filtering to customer and staff routes.**

## What Happened

Implemented the full admin menu CRUD API surface:

1. **Schema update**: Added `hidden Boolean @default(false)` to MenuItem model in schema.prisma (T01 handles the migration, but the field needed to exist for Prisma type generation).

2. **GET /api/admin/menu**: Returns all menu items including hidden ones, ordered by sortOrder. Used for admin dashboard list view.

3. **POST /api/admin/menu**: Creates a new menu item with validation — name required (non-empty string), price must be positive integer, category must be DRINK or FOOD. Vietnamese error messages match existing patterns. Optional: description, sortOrder, available.

4. **PUT /api/admin/menu/[id]**: Full update of any combination of fields with per-field validation. Returns 404 if item not found.

5. **PATCH /api/admin/menu/[id]**: Toggle endpoint for `available` or `hidden` boolean fields. Body: `{ field, value }`. Returns 404 if not found.

6. **DELETE /api/admin/menu/[id]**: Soft-delete — sets `hidden: true`. Convenience alias for PATCH hidden=true.

7. **Hidden filtering updates**:
   - `src/app/order/page.tsx`: Added `where: { hidden: false }` so customers never see hidden items
   - `src/app/api/staff/menu/route.ts`: Added `where: { hidden: false }` so staff add-item modal excludes hidden items
   - `src/app/api/order/route.ts`: Added hidden item check before unavailable check — rejects orders containing hidden items with 400 'Món này không còn trong thực đơn'

Auth is handled by existing middleware (protects `/api/admin/*`), so no explicit auth checks needed in routes. All routes include console.log for observability following the established pattern.

## Verification

Ran `npx prisma generate` to regenerate client with hidden field. Ran `npx vitest run` — all 111 tests pass across 8 test files. No regressions.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run` | 0 | ✅ pass | 5100ms |

## Deviations

Added hidden field to schema.prisma as instructed by carry-forward context (T01 running in parallel handles migration). Skipped `npx next build` per plan instructions — T01's migration must complete first for build to succeed.

## Known Issues

None.

## Files Created/Modified

- `src/app/api/admin/menu/route.ts`
- `src/app/api/admin/menu/[id]/route.ts`
- `src/app/api/order/route.ts`
- `src/app/api/staff/menu/route.ts`
- `src/app/order/page.tsx`
- `prisma/schema.prisma`
