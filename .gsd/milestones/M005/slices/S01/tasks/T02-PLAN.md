---
estimated_steps: 12
estimated_files: 5
skills_used: []
---

# T02: Menu CRUD API Routes

**Admin menu list API:**
1. Create `src/app/api/admin/menu/route.ts` with GET handler — returns all menu items including hidden ones, ordered by sortOrder. Include `hidden` field in response.
2. Add POST handler — creates a new menu item. Required fields: name (string), price (int), category (DRINK|FOOD). Optional: description, sortOrder, available. Validate inputs, return 400 with Vietnamese error for missing required fields ('Tên món không được để trống', 'Giá phải lớn hơn 0').

**Admin menu item API:**
3. Create `src/app/api/admin/menu/[id]/route.ts` with PUT handler — updates any combination of name, price, category, description, sortOrder, available. Return 404 if item not found.
4. Add PATCH handler — toggles `available` or `hidden` field. Body: `{ field: 'available' | 'hidden', value: boolean }`. Return 404 if not found.
5. Add DELETE handler — sets `hidden: true` (soft-delete). Return 404 if not found. This is a convenience alias for PATCH hidden=true.

**Update existing routes for hidden filtering:**
6. Update `src/app/order/page.tsx` — add `where: { hidden: false }` to `prisma.menuItem.findMany()` call
7. Update `src/app/api/staff/menu/route.ts` — add `where: { hidden: false }` to exclude hidden items
8. Update `src/app/api/order/route.ts` — add `hidden: false` check in menu item validation (reject orders with hidden items, return 400 'Món này không còn trong thực đơn')

**Verify:** `npx vitest run` passes. New API routes return correct responses via test.

## Inputs

- `prisma/schema.prisma (MenuItem model with hidden field)`
- `src/app/api/staff/menu/route.ts (pattern for Prisma queries)`
- `src/app/api/admin/qr-pdf/route.ts (pattern for admin auth in routes)`
- `src/app/api/order/route.ts (existing order validation)`

## Expected Output

- `src/app/api/admin/menu/route.ts (GET all items, POST create)`
- `src/app/api/admin/menu/[id]/route.ts (PUT update, PATCH toggle, DELETE soft-delete)`
- `Updated src/app/order/page.tsx (hidden filter)`
- `Updated src/app/api/staff/menu/route.ts (hidden filter)`
- `Updated src/app/api/order/route.ts (hidden item guard)`

## Verification

npx vitest run && npx next build
