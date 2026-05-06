---
estimated_steps: 29
estimated_files: 2
skills_used: []
---

# T02: Write idempotent seed script with Vietnamese menu data and 15 tables

Configure the seed command in `prisma.config.ts` and write `prisma/seed.ts` with 18 realistic Vietnamese menu items (12 drinks, 6 food) and 15 table records. Verify idempotency and data integrity.

## Steps

1. **Add seed command to `prisma.config.ts`** — Add `seed: 'npx tsx prisma/seed.ts'` to the `migrations` block. The file currently has `path: 'prisma/migrations'` in migrations — add seed alongside it.

2. **Create `prisma/seed.ts`** — Write the seed script:
   - Import `PrismaClient` from `../../generated/prisma/client` (relative path, NOT `@prisma/client` or `@/lib/prisma` — seed runs outside Next.js context so `@/` alias won't resolve).
   - Import `PrismaBetterSqlite3` from `@prisma/adapter-better-sqlite3` (capital S, lowercase qlite3).
   - Create a standalone PrismaClient with the adapter pointing to `file:prisma/dev.db`.
   - Clear all tables in reverse dependency order: `orderItem.deleteMany()` → `order.deleteMany()` → `menuItem.deleteMany()` → `table.deleteMany()` — this ensures idempotency.
   - Seed 18 menu items with Vietnamese names, VND prices as Int:
     - DRINK (12): Trà sữa trân châu (35000), Trà sữa matcha (40000), Trà sữa socola (38000), Trà sữa khoai môn (38000), Trà đào cam sả (35000), Trà vải (32000), Trà chanh leo (30000), Cà phê sữa đá (29000), Sinh tố bơ (40000), Sinh tố xoài (35000), Nước ép cam (28000), Soda chanh (25000)
     - FOOD (6): Bánh tráng trộn (25000), Khoai tây chiên (30000), Gà viên chiên (35000), Xúc xích nướng (28000), Bánh mì bơ tỏi (20000), Phô mai que (32000)
   - Set sortOrder sequentially (1, 2, 3...) within each category.
   - Seed 15 tables: number 1–15, name "Bàn 1" through "Bàn 15".
   - Log summary: "Seeded X menu items and Y tables".
   - Disconnect PrismaClient in finally block.

3. **Run and verify seed** — Execute `npx prisma db seed`. Run it a second time to confirm idempotency. Then verify data counts with a quick tsx script.

4. **Run build** — Execute `npm run build` to confirm Next.js build still passes with the updated schema and seed.

## Must-Haves

- Seed command configured in `prisma.config.ts` migrations block
- `prisma/seed.ts` creates 18 menu items (12 DRINK + 6 FOOD) with Vietnamese names
- All prices are Int VND values (20000–40000 range)
- 15 tables seeded with names "Bàn 1" through "Bàn 15"
- Seed is idempotent — running twice produces same result, no errors
- `npm run build` passes after seeding

## IMPORTANT GOTCHAS

- Import path for PrismaClient in seed.ts MUST be `../../generated/prisma/client` (relative, not alias)
- `PrismaBetterSqlite3` spelling: capital S, lowercase qlite3
- Delete in reverse dependency order to avoid FK constraint violations
- Seed runs outside Next.js — no `@/` aliases, no `process.env` from Next.js config

## Inputs

- ``prisma.config.ts` — existing config, needs seed command added`
- ``prisma/schema.prisma` — full schema from T01 with all models and enums`
- ``generated/prisma/` — regenerated client from T01 with MenuItem, Table types`
- ``src/lib/prisma.ts` — reference for adapter pattern (PrismaBetterSqlite3 spelling)`

## Expected Output

- ``prisma.config.ts` — updated with seed command in migrations block`
- ``prisma/seed.ts` — idempotent seed script with 18 Vietnamese menu items + 15 tables`
- ``prisma/dev.db` — populated SQLite database with seed data`

## Verification

npx prisma db seed && npx prisma db seed && npx tsx -e "import {PrismaClient} from './generated/prisma/client'; import {PrismaBetterSqlite3} from '@prisma/adapter-better-sqlite3'; const p = new PrismaClient({adapter: new PrismaBetterSqlite3({url:'file:prisma/dev.db'})}); const [m,t] = await Promise.all([p.menuItem.count(), p.table.count()]); console.log('MenuItems:', m, 'Tables:', t); await p.$disconnect();" && npm run build
