---
estimated_steps: 15
estimated_files: 11
skills_used: []
---

# T01: Schema Migration + Toast + Admin Layout Shell

**Schema migration:**
1. Add `hidden Boolean @default(false)` field to MenuItem model in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add-menu-hidden` to generate and apply migration
3. Verify existing seed data is preserved (all items get hidden=false)

**Toast component:**
4. Create `src/components/ui/Toast.tsx` — portal-based slide-in toast at bottom of screen
5. Create `src/components/ui/ToastProvider.tsx` — React context with `useToast()` hook exposing `toast.success(msg)` and `toast.error(msg)`
6. Green variant for success, red for error. Auto-dismiss after 3 seconds. z-index 60+ to clear CartSheet.
7. Wrap root layout (`src/app/layout.tsx`) with `<ToastProvider>`

**Admin layout + navigation:**
8. Create `src/components/admin/AdminNav.tsx` — bottom tab nav replicating StaffNav pattern with 3 tabs: Thực đơn (/admin/menu), Bàn (/admin/tables), QR Code (/admin/qr). Plus logout link.
9. Create `src/app/admin/layout.tsx` — wraps children with `pb-20` padding + AdminNav (same as staff layout)
10. Update `src/app/admin/page.tsx` to redirect to `/admin/menu` (replace current QR-only page)
11. Create stub pages for /admin/menu, /admin/tables, /admin/qr with placeholder content

**Verify:** `npx vitest run` passes all 111 existing tests. `npx next build` succeeds. Navigate to /admin and see tabbed layout with 3 tabs.

## Inputs

- `prisma/schema.prisma (current MenuItem model)`
- `src/app/staff/StaffNav.tsx (nav pattern to replicate)`
- `src/app/staff/layout.tsx (layout pattern to replicate)`
- `src/app/layout.tsx (root layout to wrap with ToastProvider)`

## Expected Output

- `prisma/migrations/**/migration.sql (add hidden field)`
- `src/components/ui/Toast.tsx`
- `src/components/ui/ToastProvider.tsx`
- `src/components/admin/AdminNav.tsx`
- `src/app/admin/layout.tsx`
- `src/app/admin/menu/page.tsx (stub)`
- `src/app/admin/tables/page.tsx (stub)`
- `src/app/admin/qr/page.tsx (stub)`

## Verification

npx vitest run && npx next build
