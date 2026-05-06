# Codebase Map

Generated: 2026-05-06T04:42:13Z | Files: 38 | Described: 0/38
<!-- gsd:codebase-meta {"generatedAt":"2026-05-06T04:42:13Z","fingerprint":"56e486f253e70e230cdaf1645f3713ba2ec085a2","fileCount":38,"truncated":false} -->

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

### src/app/order/
- `src/app/order/page.tsx`

### src/components/order/
- `src/components/order/CartBar.tsx`
- `src/components/order/CartProvider.tsx`
- `src/components/order/CartSheet.tsx`
- `src/components/order/CartUI.tsx`
- `src/components/order/ErrorPage.tsx`
- `src/components/order/MenuView.tsx`
- `src/components/order/OrderConfirmation.tsx`

### src/lib/
- `src/lib/auth.ts`
- `src/lib/format.ts`
- `src/lib/prisma.ts`
