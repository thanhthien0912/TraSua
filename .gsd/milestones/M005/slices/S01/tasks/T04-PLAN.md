---
estimated_steps: 14
estimated_files: 2
skills_used: []
---

# T04: Admin Menu CRUD Tests

Write comprehensive tests for the admin menu API routes and hidden-item filtering.

**Menu CRUD API tests:**
1. Create `src/app/api/admin/menu/__tests__/menu-crud.test.ts`
2. Test GET /api/admin/menu — returns all items including hidden ones
3. Test POST /api/admin/menu — creates item with valid data, returns 400 for missing name, returns 400 for price <= 0
4. Test PUT /api/admin/menu/[id] — updates fields, returns 404 for non-existent ID
5. Test PATCH /api/admin/menu/[id] — toggles available flag, toggles hidden flag, returns 404 for non-existent ID
6. Test DELETE /api/admin/menu/[id] — sets hidden=true, returns 404 for non-existent ID

**Hidden-item filtering tests:**
7. Create `src/lib/__tests__/hidden-menu-filter.test.ts`
8. Test that hidden items are excluded from customer menu queries
9. Test that hidden items are excluded from staff menu queries
10. Test that order creation rejects hidden menu items

**Verify:** `npx vitest run` — all tests pass including existing 111 + new tests. Target: 125+ total tests.

## Inputs

- `src/lib/__tests__/add-item-api.test.ts (existing test pattern)`
- `src/lib/__tests__/order-status.test.ts (existing test pattern)`
- `src/app/api/admin/menu/route.ts (routes under test)`
- `src/app/api/admin/menu/[id]/route.ts (routes under test)`

## Expected Output

- `src/app/api/admin/menu/__tests__/menu-crud.test.ts`
- `src/lib/__tests__/hidden-menu-filter.test.ts`

## Verification

npx vitest run
