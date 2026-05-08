---
estimated_steps: 3
estimated_files: 7
skills_used: []
---

# T02: Add error states with retry to all pages

Add network error states with Vietnamese error messages and retry buttons to all pages. Error state shows when fetch fails. Retry button re-triggers the fetch. Follow Toast error pattern for consistency.

**Files:** src/app/order/page.tsx, src/app/staff/bar/page.tsx, src/app/staff/kitchen/page.tsx, src/app/staff/checkout/page.tsx, src/app/admin/menu/page.tsx, src/app/admin/tables/page.tsx, src/app/admin/qr/page.tsx

**Verification:** All pages show error state on network failure (can test by stopping server mid-request). Retry button functional. Vietnamese error messages shown.

## Inputs

- `Skeleton loaders from T01`

## Expected Output

- `Network error states with retry buttons across all pages`

## Verification

Error states show on network failure; retry works
