# S01: Admin Menu Management

**Goal:** Deliver the admin dashboard shell with tabbed navigation, complete menu item CRUD (create, edit, toggle availability, soft-delete, restore), toast notification infrastructure, and hidden-item filtering across customer and staff pages.
**Demo:** Shop owner logs into /admin, sees tabbed dashboard with 3 tabs. Creates a new drink item with name/price/category. Toggles an existing item to 'Hết hàng'. Soft-deletes an old item (grayed out in admin, gone from customer menu). Restores it. All operations show toast feedback. Customer /order page excludes hidden items. Existing 111 tests still pass.

## Must-Haves

- 1. Admin dashboard at /admin loads with 3 tabs (Thực đơn, Bàn, QR Code) and bottom navigation
- 2. GET /api/admin/menu returns all items including hidden ones
- 3. POST /api/admin/menu creates a new menu item visible on customer /order page
- 4. PUT /api/admin/menu/[id] updates item fields (name, price, category, description, sortOrder)
- 5. PATCH /api/admin/menu/[id] toggles available and hidden flags
- 6. Soft-deleted items (hidden=true) are excluded from customer /order and staff /api/staff/menu
- 7. POST /api/order rejects hidden menu items with 400 status
- 8. Toast notifications appear for success/error on all CRUD operations
- 9. All 111 existing tests pass after schema migration
- 10. New API route tests achieve happy-path + primary error-case coverage

## Proof Level

- This slice proves: API tests verify CRUD correctness and hidden-item filtering. Build passes. Manual verification: create item in admin → visible on customer page.

## Integration Closure

Customer /order page, staff /api/staff/menu, and POST /api/order all updated to respect hidden flag. Admin auth middleware unchanged — new routes under /admin/* and /api/admin/* automatically protected.

## Verification

- Console logging on all admin CRUD API routes (existing pattern from staff routes). Toast component provides visual feedback for all operations.

## Tasks

- [x] **T01: Schema Migration + Toast + Admin Layout Shell** `est:medium`
  **Schema migration:**
  1. Add `hidden Boolean @default(false)` field to MenuItem model in `prisma/schema.prisma`
  2. Run `npx prisma migrate dev --name add-menu-hidden` to generate and apply migration
  3. Verify existing seed data is preserved (all items get hidden=false)
  - Files: `prisma/schema.prisma`, `prisma/migrations/*/migration.sql`, `src/components/ui/Toast.tsx`, `src/components/ui/ToastProvider.tsx`, `src/app/layout.tsx`, `src/components/admin/AdminNav.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/menu/page.tsx`, `src/app/admin/tables/page.tsx`, `src/app/admin/qr/page.tsx`
  - Verify: npx vitest run && npx next build

- [x] **T02: Menu CRUD API Routes** `est:medium`
  **Admin menu list API:**
  1. Create `src/app/api/admin/menu/route.ts` with GET handler — returns all menu items including hidden ones, ordered by sortOrder. Include `hidden` field in response.
  2. Add POST handler — creates a new menu item. Required fields: name (string), price (int), category (DRINK|FOOD). Optional: description, sortOrder, available. Validate inputs, return 400 with Vietnamese error for missing required fields ('Tên món không được để trống', 'Giá phải lớn hơn 0').
  - Files: `src/app/api/admin/menu/route.ts`, `src/app/api/admin/menu/[id]/route.ts`, `src/app/order/page.tsx`, `src/app/api/staff/menu/route.ts`, `src/app/api/order/route.ts`
  - Verify: npx vitest run && npx next build

- [ ] **T03: Admin Menu Page UI** `est:large`
  Build the full menu management page at `/admin/menu`.
  - Files: `src/app/admin/menu/page.tsx`, `src/components/admin/MenuItemForm.tsx`
  - Verify: npx next build

- [ ] **T04: Admin Menu CRUD Tests** `est:medium`
  Write comprehensive tests for the admin menu API routes and hidden-item filtering.
  - Files: `src/app/api/admin/menu/__tests__/menu-crud.test.ts`, `src/lib/__tests__/hidden-menu-filter.test.ts`
  - Verify: npx vitest run

## Files Likely Touched

- prisma/schema.prisma
- prisma/migrations/*/migration.sql
- src/components/ui/Toast.tsx
- src/components/ui/ToastProvider.tsx
- src/app/layout.tsx
- src/components/admin/AdminNav.tsx
- src/app/admin/layout.tsx
- src/app/admin/page.tsx
- src/app/admin/menu/page.tsx
- src/app/admin/tables/page.tsx
- src/app/admin/qr/page.tsx
- src/app/api/admin/menu/route.ts
- src/app/api/admin/menu/[id]/route.ts
- src/app/order/page.tsx
- src/app/api/staff/menu/route.ts
- src/app/api/order/route.ts
- src/components/admin/MenuItemForm.tsx
- src/app/api/admin/menu/__tests__/menu-crud.test.ts
- src/lib/__tests__/hidden-menu-filter.test.ts
