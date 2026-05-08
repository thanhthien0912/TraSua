---
estimated_steps: 3
estimated_files: 3
skills_used: []
---

# T01: Build admin tables page UI with CRUD and delete guard

Build full /admin/tables page with table list, add/rename/delete controls. Wire to GET/POST /api/admin/tables and PUT/DELETE /api/admin/tables/[id]. Handle 409 deletion guard (unpaid orders) with error toast. Use S01's toast system. Follow MenuItemForm pattern for inline rename edit.

**Files:** src/app/admin/tables/page.tsx, src/app/admin/qr/page.tsx, src/components/admin/AdminNav.tsx

**Verification:** vitest run — 152 existing tests pass; new table-page tests added and pass; next build succeeds

## Inputs

- `S01 admin shell, AdminNav, toast system`

## Expected Output

- `src/app/admin/tables/page.tsx`
- `src/app/admin/qr/page.tsx`

## Verification

vitest run — 152 existing tests pass; new table-page tests added and pass; next build succeeds
