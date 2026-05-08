---
estimated_steps: 3
estimated_files: 2
skills_used: []
---

# T04: Build admin tables page UI

Build full /admin/tables page: fetch tables via GET /api/admin/tables, show table cards with name and order count, add 'Thêm bàn' button (POST), rename inline (PATCH), two-tap delete with guard (toast.error on 409), empty-state UI. Also update /admin/qr to show QR download button.

**Files:** src/app/admin/tables/page.tsx, src/app/admin/qr/page.tsx

**Verification:** next build compiles without errors; vitest run passes

## Inputs

- `Table CRUD API routes`

## Expected Output

- `src/app/admin/tables/page.tsx`
- `src/app/admin/qr/page.tsx`

## Verification

next build compiles without errors; vitest run passes
