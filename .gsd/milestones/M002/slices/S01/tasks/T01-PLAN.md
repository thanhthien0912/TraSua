---
estimated_steps: 10
estimated_files: 3
skills_used: []
---

# T01: VND Formatter Utility + Order Page with Table Validation

Create the VND price formatting utility and the /order Server Component page with table validation.

**Steps:**
1. Create `src/lib/format.ts` with `formatVND(price: number): string` using `Intl.NumberFormat('vi-VN')` to produce '45,000đ' format. Export as named export.
2. Create `src/app/order/page.tsx` as an async Server Component:
   - Accept `searchParams: Promise<{ table?: string }>` — **must await** (Next.js 16 breaking change)
   - Parse and validate `table` param: must be numeric, must exist in DB via `prisma.table.findFirst({ where: { number: parseInt(table) } })`
   - If invalid/missing: render inline ErrorPage component with Vietnamese message 'Bàn không hợp lệ. Vui lòng scan lại mã QR tại bàn của bạn.'
   - If valid: query all menu items sorted by sortOrder, serialize as plain objects (id, name, category, price, description, available, sortOrder), pass to MenuView client component
   - Pass table info as `{ id: number, number: number, name: string }` prop
3. Create `src/components/order/ErrorPage.tsx` — Vietnamese error display with amber branding, dead-end (no navigation to ordering)

## Inputs

- `prisma/schema.prisma (MenuItem, Table models)`
- `src/lib/prisma.ts (PrismaClient singleton)`
- `src/app/page.tsx (visual language reference)`
- `src/app/globals.css (color scheme reference)`

## Expected Output

- `src/lib/format.ts`
- `src/app/order/page.tsx`
- `src/components/order/ErrorPage.tsx`

## Verification

- `next build` completes without type errors
- Navigate to /order?table=99 — see Vietnamese error page
- Navigate to /order — see Vietnamese error page
- Navigate to /order?table=5 — page does not crash (MenuView not yet built, but server component renders)
