# S02: Database Schema & Seed Data — Research

**Date:** 2025-07-10

## Summary

S02 replaces the placeholder Category model from S01 with the full Prisma schema (MenuItem, Table, Order, OrderItem + enums) and adds an idempotent seed script with 15–20 realistic Vietnamese menu items and 15 table records. This is targeted research — Prisma schema design with known patterns applied to a greenfield codebase.

The existing schema has only a `Category` model with `id`, `name`, `type` fields and one migration. The S02 work must: (1) replace/extend this schema with all four models and three enums per the architectural decision for full schema upfront, (2) create a new migration, (3) write a seed script configured in `prisma.config.ts`, and (4) regenerate the Prisma client. The Prisma 7 seed configuration uses `migrations.seed` in `prisma.config.ts` (not package.json — that's Prisma 5 style).

Requirements covered: R001/R002 (schema foundation for ordering + bar/kitchen routing via Category enum DRINK/FOOD), R006 (SQLite, no external DB), R007 (Vietnamese menu data for customer UI in M002).

## Recommendation

**Replace the placeholder Category model with the full schema in a single migration.** Define all four models (MenuItem, Table, Order, OrderItem) and three enums (Category, OrderStatus, ItemStatus) in one shot. Write the seed script as `prisma/seed.ts` using `tsx` runner (already installed as devDep). Configure the seed command in `prisma.config.ts` under `migrations.seed`. Use `deleteMany` + `create` pattern for idempotency rather than upsert (simpler for seed data, and this is dev-only seeding).

## Implementation Landscape

### Key Files

- `prisma/schema.prisma` — **Replace entirely.** Currently has only Category model. Needs: MenuItem (name, category enum, price Int for VND, available Boolean, description?, image?), Table (number Int @unique, name String for "Bàn N"), Order (tableId, status enum, createdAt, totalAmount), OrderItem (orderId, menuItemId, quantity, status enum, notes?). Plus enums: Category (DRINK, FOOD), OrderStatus (PENDING, CONFIRMED, PREPARING, READY, SERVED, PAID, CANCELLED), ItemStatus (PENDING, PREPARING, READY, SERVED, CANCELLED).
- `prisma.config.ts` — **Add seed command.** Add `seed: 'npx tsx prisma/seed.ts'` to `migrations` block. Currently only has `path` and `datasource`.
- `prisma/seed.ts` — **Create new.** Import PrismaClient from `../../generated/prisma/client` and PrismaBetterSqlite3 adapter. Clear all tables, seed 15–20 menu items (Vietnamese names, VND prices 25K–55K, DRINK/FOOD categories), seed 15 Table records.
- `src/lib/prisma.ts` — **No changes needed.** Singleton pattern is correct and will work with new models after `prisma generate`.
- `.env` — **No changes needed.** DATABASE_URL already configured.
- `prisma/migrations/` — **New migration created** by `npx prisma migrate dev --name add_full_schema`. The old Category migration will be superseded.

### Build Order

1. **Schema first** — Write the full `prisma/schema.prisma` with all models and enums. This is the foundation everything else depends on. Run `npx prisma migrate dev --name add_full_schema` to create migration + update SQLite + regenerate client.
2. **Seed config** — Update `prisma.config.ts` to add the seed command.
3. **Seed script** — Write `prisma/seed.ts` with realistic Vietnamese data. Must import PrismaClient correctly (from `../../generated/prisma/client`) and use the better-sqlite3 adapter pattern established in `src/lib/prisma.ts`.
4. **Verify** — Run `npx prisma db seed`, confirm data, run build to ensure no type errors.

### Verification Approach

1. `npx prisma migrate dev --name add_full_schema` — succeeds without errors
2. `npx prisma generate` — succeeds, `generated/prisma/` updated with new model types
3. `npx tsc --noEmit` — zero type errors (ensures schema types are correct)
4. `npx prisma db seed` — succeeds, prints seeding confirmation
5. `npx prisma db seed` (run twice) — idempotent, no duplicate errors
6. Node script to verify counts: `npx tsx -e "import {PrismaClient} from './generated/prisma/client'; const p = new PrismaClient(); console.log(await p.menuItem.count(), await p.table.count())"` — should show 15-20 items and 15 tables
7. `npm run build` — Next.js build still succeeds

## Constraints

- **Prisma 7 style:** Uses `prisma-client` provider (not `prisma-client-js`), `prisma.config.ts` for config, generated client at `generated/prisma/`.
- **SQLite limitations:** No native enums — Prisma maps enums to TEXT columns with validation. No `@db.Decimal` — use Int for VND prices (no decimal VND). No `@updatedAt` on DateTime in SQLite — must handle manually or accept limitation.
- **Adapter pattern:** Seed script must create its own PrismaClient with PrismaBetterSqlite3 adapter (cannot import the singleton from `src/lib/prisma.ts` because seed runs outside Next.js context and the path alias `@/` won't resolve).
- **Existing migration:** The `20260506022924_init` migration created the Category table. The new migration must handle the schema diff cleanly. Best approach: since Category model is being removed/replaced, Prisma migrate will generate DROP + CREATE statements automatically.

## Common Pitfalls

- **Seed script import path** — Must use relative path `../../generated/prisma/client` not `@prisma/client` or `@/lib/prisma`. The `@/` alias only works in Next.js context, and Prisma 7 generates to a custom output path.
- **SQLite reserved words** — `Order` is a SQL reserved word. Prisma handles this with quoting, but `@@map("orders")` is recommended for clarity. Similarly, `Table` should use `@@map("tables")`.
- **VND prices as Int** — Vietnamese Đồng has no decimal places in practice (smallest unit is 1000đ at shops). Store as Int (e.g., 35000 for 35,000đ). Do NOT use Float or Decimal.
- **Seed idempotency** — Use `deleteMany()` on all tables in reverse dependency order (OrderItem → Order → MenuItem → Table) before seeding. Don't use `upsert` — it's more complex for bulk seeding and the data is disposable dev data.

## Schema Design

```prisma
enum Category {
  DRINK
  FOOD
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  SERVED
  PAID
  CANCELLED
}

enum ItemStatus {
  PENDING
  PREPARING
  READY
  SERVED
  CANCELLED
}

model MenuItem {
  id          Int        @id @default(autoincrement())
  name        String
  category    Category
  price       Int        // VND, e.g. 35000
  description String?
  available   Boolean    @default(true)
  sortOrder   Int        @default(0)
  createdAt   DateTime   @default(now())
  orderItems  OrderItem[]

  @@map("menu_items")
}

model Table {
  id        Int      @id @default(autoincrement())
  number    Int      @unique
  name      String   // "Bàn 1", "Bàn 2"...
  orders    Order[]

  @@map("tables")
}

model Order {
  id         Int         @id @default(autoincrement())
  tableId    Int
  table      Table       @relation(fields: [tableId], references: [id])
  status     OrderStatus @default(PENDING)
  totalAmount Int        @default(0)
  createdAt  DateTime    @default(now())
  items      OrderItem[]

  @@map("orders")
}

model OrderItem {
  id         Int        @id @default(autoincrement())
  orderId    Int
  order      Order      @relation(fields: [orderId], references: [id])
  menuItemId Int
  menuItem   MenuItem   @relation(fields: [menuItemId], references: [id])
  quantity   Int        @default(1)
  status     ItemStatus @default(PENDING)
  notes      String?
  createdAt  DateTime   @default(now())

  @@map("order_items")
}
```

## Seed Data Plan

15–20 Vietnamese menu items across DRINK and FOOD categories:

**DRINK (12 items):**
- Trà sữa trân châu (35,000đ)
- Trà sữa matcha (40,000đ)
- Trà sữa socola (38,000đ)
- Trà sữa khoai môn (38,000đ)
- Trà đào cam sả (35,000đ)
- Trà vải (32,000đ)
- Trà chanh leo (30,000đ)
- Cà phê sữa đá (29,000đ)
- Sinh tố bơ (40,000đ)
- Sinh tố xoài (35,000đ)
- Nước ép cam (28,000đ)
- Soda chanh (25,000đ)

**FOOD (6 items):**
- Bánh tráng trộn (25,000đ)
- Khoai tây chiên (30,000đ)
- Gà viên chiên (35,000đ)
- Xúc xích nướng (28,000đ)
- Bánh mì bơ tỏi (20,000đ)
- Phô mai que (32,000đ)

Total: 18 items. Price range: 20,000đ – 40,000đ. All realistic for a mid-range Vietnamese tea shop.