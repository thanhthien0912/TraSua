# Codebase Map

Generated: 2026-05-06T06:33:11Z | Files: 56 | Described: 0/56
<!-- gsd:codebase-meta {"generatedAt":"2026-05-06T06:33:11Z","fingerprint":"a9f65183b1b22173ee61bb1f50c976aad81ea0f7","fileCount":56,"truncated":false} -->

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

### src/app/api/staff/orders/[orderId]/items/[itemId]/
- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`

### src/app/order/
- `src/app/order/page.tsx`

### src/app/staff/
- `src/app/staff/layout.tsx`
- `src/app/staff/page.tsx`
- `src/app/staff/StaffNav.tsx`

### src/app/staff/bar/
- `src/app/staff/bar/page.tsx`

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
- `src/components/staff/OrderCard.tsx`
- `src/components/staff/StationView.tsx`
- `src/components/staff/useNotification.ts`
- `src/components/staff/useOrderStream.ts`

### src/lib/
- `src/lib/auth.ts`
- `src/lib/categorize-orders.ts`
- `src/lib/format.ts`
- `src/lib/order-status.ts`
- `src/lib/prisma.ts`
- `src/lib/sse.ts`

### src/lib/__tests__/
- `src/lib/__tests__/cancel-recalculation.test.ts`
- `src/lib/__tests__/categorize-orders.test.ts`
- `src/lib/__tests__/order-status.test.ts`
- `src/lib/__tests__/sse.test.ts`
