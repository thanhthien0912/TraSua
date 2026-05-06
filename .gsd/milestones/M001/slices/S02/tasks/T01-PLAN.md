---
estimated_steps: 25
estimated_files: 4
skills_used: []
---

# T01: Replace placeholder schema with full ordering models and run migration

Replace the existing Category-only Prisma schema with the full ordering system schema: 4 models (MenuItem, Table, Order, OrderItem) and 3 enums (Category, OrderStatus, ItemStatus). Run migration to create all tables in SQLite and regenerate the Prisma client.

## Steps

1. **Rewrite `prisma/schema.prisma`** — Keep the generator and datasource blocks unchanged. Remove the placeholder Category model. Add three enums: `Category` (DRINK, FOOD), `OrderStatus` (PENDING, CONFIRMED, PREPARING, READY, SERVED, PAID, CANCELLED), `ItemStatus` (PENDING, PREPARING, READY, SERVED, CANCELLED). Add four models:
   - `MenuItem`: id, name, category (Category enum), price (Int for VND), description (String?), available (Boolean default true), sortOrder (Int default 0), createdAt (DateTime), orderItems relation. Map to `menu_items`.
   - `Table`: id, number (Int @unique), name (String like "Bàn 1"), orders relation. Map to `tables`.
   - `Order`: id, tableId (Int), table relation, status (OrderStatus default PENDING), totalAmount (Int default 0), createdAt (DateTime), items relation. Map to `orders`.
   - `OrderItem`: id, orderId (Int), order relation, menuItemId (Int), menuItem relation, quantity (Int default 1), status (ItemStatus default PENDING), notes (String?), createdAt (DateTime). Map to `order_items`.
   - Use `@@map()` on all models to avoid SQL reserved word issues with `Order` and `Table`.
   - Use Int for all prices (VND has no decimals in practice).
   - Do NOT use `@updatedAt` — SQLite doesn't support it natively.

2. **Delete old database** — Remove `prisma/dev.db` before running migration to avoid migration drift issues with the placeholder schema being replaced.

3. **Run migration** — Execute `npx prisma migrate dev --name add_full_schema`. This creates a new migration SQL file and rebuilds the SQLite database. If it fails due to existing data, the database deletion in step 2 handles this.

4. **Verify generated client** — Run `npx prisma generate` to ensure the client at `generated/prisma/` has all new model types. Then run `npx tsc --noEmit` to confirm zero type errors.

## Must-Haves

- All 4 models and 3 enums defined in schema.prisma
- @@map() annotations on all models (menu_items, tables, orders, order_items)
- Price fields are Int (not Float or Decimal)
- Migration succeeds and creates all tables
- `npx tsc --noEmit` passes with zero errors
- Generator output path remains `../generated/prisma`

## IMPORTANT GOTCHAS

- Prisma 7 uses `prisma-client` provider (NOT `prisma-client-js`)
- `PrismaBetterSqlite3` has capital S, lowercase qlite3
- SQLite maps enums to TEXT columns — this is expected
- `Order` and `Table` are SQL reserved words — `@@map()` is critical

## Inputs

- ``prisma/schema.prisma` — existing placeholder schema with Category model`
- ``prisma.config.ts` — Prisma 7 config with datasource URL`
- ``generated/prisma/` — existing generated client to be regenerated`

## Expected Output

- ``prisma/schema.prisma` — full schema with 4 models and 3 enums`
- ``prisma/migrations/*_add_full_schema/migration.sql` — new migration SQL`
- ``generated/prisma/` — regenerated client with MenuItem, Table, Order, OrderItem types`
- ``prisma/dev.db` — rebuilt SQLite database with all tables`

## Verification

npx prisma migrate dev --name add_full_schema && npx prisma generate && npx tsc --noEmit
