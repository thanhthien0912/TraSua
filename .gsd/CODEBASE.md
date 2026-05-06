# Codebase Map

Generated: 2026-05-06T09:01:42Z | Files: 71 | Described: 0/71
<!-- gsd:codebase-meta {"generatedAt":"2026-05-06T09:01:42Z","fingerprint":"aba9ebfc3f8ff234de013a8a3f508e429cde2fd4","fileCount":71,"truncated":false} -->

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
- `tsconfig.json`
- `tsconfig.tsbuildinfo`
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

### src/
- `src/middleware.ts`

### src/app/
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`

### src/app/admin/
- `src/app/admin/page.tsx`

### src/app/admin/login/
- `src/app/admin/login/page.tsx`

### src/app/api/admin/login/
- `src/app/api/admin/login/route.ts`

### src/app/api/admin/qr-pdf/
- `src/app/api/admin/qr-pdf/route.ts`

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

### src/app/staff/bar/
- `src/app/staff/bar/page.tsx`

### src/app/staff/checkout/
- `src/app/staff/checkout/page.tsx`

### src/app/staff/kitchen/
- `src/app/staff/kitchen/page.tsx`

### src/components/order/
- `src/components/order/CartBar.tsx`
- `src/components/order/CartProvider.tsx`
- `src/components/order/CartSheet.tsx`
- `src/components/order/CartUI.tsx`
- `src/components/order/ErrorPage.tsx`
- `src/components/order/MenuView.tsx`
- `src/components/order/OrderConfirmation.tsx`

### src/components/staff/
- `src/components/staff/BillView.tsx`
- `src/components/staff/MenuPickerModal.tsx`
- `src/components/staff/OrderCard.tsx`
- `src/components/staff/StationView.tsx`
- `src/components/staff/useNotification.ts`
- `src/components/staff/useOrderStream.ts`

### src/components/staff/__tests__/
- `src/components/staff/__tests__/orderReducer.test.ts`

### src/lib/
- `src/lib/auth.ts`
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
- `src/lib/__tests__/order-status-paid.test.ts`
- `src/lib/__tests__/order-status.test.ts`
- `src/lib/__tests__/sse.test.ts`
