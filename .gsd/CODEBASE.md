# Codebase Map

Generated: 2026-05-11T04:15:41Z | Files: 88 | Described: 0/88
<!-- gsd:codebase-meta {"generatedAt":"2026-05-11T04:15:41Z","fingerprint":"d999a0f37841bc7a2f2e10bde126904a61b90f99","fileCount":88,"truncated":false} -->

### (root)/
- `.gitignore`
- `AGENTS.md`
- `CLAUDE.md`
- `eslint.config.mjs`
- `next-env.d.ts`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `prisma.config.ts`
- `README.md`
- `start.bat`
- `start.sh`
- `tsconfig.json`
- `vitest.config.ts`

### prisma/
- `prisma/dev.db`
- `prisma/schema.prisma`
- `prisma/seed.ts`

### prisma/migrations/
- `prisma/migrations/migration_lock.toml`

### prisma/migrations/20260506024910_add_full_schema/
- `prisma/migrations/20260506024910_add_full_schema/migration.sql`

### prisma/migrations/20260506071758_add_paid_at/
- `prisma/migrations/20260506071758_add_paid_at/migration.sql`

### prisma/migrations/20260506090234_add_menu_hidden/
- `prisma/migrations/20260506090234_add_menu_hidden/migration.sql`

### src/app/
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`

### src/app/admin/
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`

### src/app/admin/menu/
- `src/app/admin/menu/page.tsx`

### src/app/admin/qr/
- `src/app/admin/qr/page.tsx`

### src/app/admin/tables/
- `src/app/admin/tables/page.tsx`

### src/app/api/admin/menu/
- `src/app/api/admin/menu/route.ts`

### src/app/api/admin/menu/[id]/
- `src/app/api/admin/menu/[id]/route.ts`

### src/app/api/admin/menu/__tests__/
- `src/app/api/admin/menu/__tests__/menu-crud.test.ts`

### src/app/api/admin/qr-pdf/
- `src/app/api/admin/qr-pdf/route.ts`

### src/app/api/admin/qr-pdf/__tests__/
- `src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts`

### src/app/api/admin/tables/
- `src/app/api/admin/tables/route.ts`

### src/app/api/admin/tables/[id]/
- `src/app/api/admin/tables/[id]/route.ts`

### src/app/api/admin/tables/__tests__/
- `src/app/api/admin/tables/__tests__/table-crud.test.ts`

### src/app/api/order/
- `src/app/api/order/route.ts`

### src/app/api/staff/checkout/
- `src/app/api/staff/checkout/route.ts`

### src/app/api/staff/menu/
- `src/app/api/staff/menu/route.ts`

### src/app/api/staff/orders/
- `src/app/api/staff/orders/route.ts`

### src/app/api/staff/orders/[orderId]/items/
- `src/app/api/staff/orders/[orderId]/items/route.ts`

### src/app/api/staff/orders/[orderId]/items/[itemId]/
- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`

### src/app/api/staff/orders/stream/
- `src/app/api/staff/orders/stream/route.ts`

### src/app/api/staff/tables/[tableId]/bill/
- `src/app/api/staff/tables/[tableId]/bill/route.ts`

### src/app/api/staff/tables/[tableId]/pay/
- `src/app/api/staff/tables/[tableId]/pay/route.ts`

### src/app/order/
- `src/app/order/page.tsx`

### src/app/staff/
- `src/app/staff/layout.tsx`
- `src/app/staff/page.tsx`
- `src/app/staff/StaffNav.tsx`

### src/app/staff/add-order/
- `src/app/staff/add-order/page.tsx`

### src/app/staff/bar/
- `src/app/staff/bar/page.tsx`

### src/app/staff/checkout/
- `src/app/staff/checkout/page.tsx`

### src/app/staff/kitchen/
- `src/app/staff/kitchen/page.tsx`

### src/components/admin/
- `src/components/admin/AdminNav.tsx`
- `src/components/admin/MenuItemForm.tsx`

### src/components/order/
- `src/components/order/CartBar.tsx`
- `src/components/order/CartProvider.tsx`
- `src/components/order/CartSheet.tsx`
- `src/components/order/CartUI.tsx`
- `src/components/order/ErrorPage.tsx`
- `src/components/order/MenuView.tsx`
- `src/components/order/OrderConfirmation.tsx`

### src/components/staff/
- `src/components/staff/AddOrderModal.tsx`
- `src/components/staff/BillView.tsx`
- `src/components/staff/MenuPickerModal.tsx`
- `src/components/staff/OrderCard.tsx`
- `src/components/staff/StationView.tsx`
- `src/components/staff/useNotification.ts`
- `src/components/staff/useOrderStream.ts`

### src/components/staff/__tests__/
- `src/components/staff/__tests__/orderReducer.test.ts`

### src/components/ui/
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/Toast.tsx`
- `src/components/ui/ToastProvider.tsx`

### src/lib/
- `src/lib/categorize-orders.ts`
- `src/lib/format.ts`
- `src/lib/order-status.ts`
- `src/lib/prisma.ts`
- `src/lib/sse.ts`

### src/lib/__tests__/
- `src/lib/__tests__/add-item-api.test.ts`
- `src/lib/__tests__/bill-aggregation.test.ts`
- `src/lib/__tests__/cancel-recalculation.test.ts`
- `src/lib/__tests__/categorize-orders.test.ts`
- `src/lib/__tests__/hidden-menu-filter.test.ts`
- `src/lib/__tests__/order-status-paid.test.ts`
- `src/lib/__tests__/order-status.test.ts`
- `src/lib/__tests__/sse.test.ts`
