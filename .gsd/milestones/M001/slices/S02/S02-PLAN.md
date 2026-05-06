# S02: Database Schema & Seed Data

**Goal:** Replace placeholder Category model with full ordering schema (MenuItem, Table, Order, OrderItem + enums) and seed database with 18 Vietnamese menu items and 15 tables. After this, `npx prisma db seed` populates the database and queries return correct data.
**Demo:** Chạy prisma db seed → database có 10+ món mẫu → query thấy đúng

## Must-Haves

- `npx prisma migrate dev` succeeds creating all 4 tables
- `npx prisma generate` produces types for MenuItem, Table, Order, OrderItem
- `npx tsc --noEmit` has zero type errors
- `npx prisma db seed` succeeds and is idempotent (running twice produces no errors)
- Database contains 18 MenuItems (12 DRINK + 6 FOOD) and 15 Tables
- `npm run build` still succeeds
- All prices are Int (VND, no decimals), all names are Vietnamese

## Proof Level

- This slice proves: Contract-level — schema types compile, migration applies, seed data persists and queries correctly. No runtime API or UI proof.

## Integration Closure

- Upstream: `prisma/schema.prisma` (placeholder Category model from S01), `prisma.config.ts`, `src/lib/prisma.ts` singleton, `generated/prisma/` client
- New wiring: seed command in `prisma.config.ts`, `prisma/seed.ts` script
- Remaining for milestone: S03 (QR Code Generator) is independent. Menu API routes and customer UI come in M002.

## Verification

- Run the task and slice verification checks for this slice.

## Tasks

- [x] **T01: Replace placeholder schema with full ordering models and run migration** `est:25m`
  Replace the existing Category-only Prisma schema with the full ordering system schema: 4 models (MenuItem, Table, Order, OrderItem) and 3 enums (Category, OrderStatus, ItemStatus). Run migration to create all tables in SQLite and regenerate the Prisma client.
  - Files: `prisma/schema.prisma`, `prisma/dev.db`, `prisma/migrations/`, `generated/prisma/`
  - Verify: npx prisma migrate dev --name add_full_schema && npx prisma generate && npx tsc --noEmit

- [x] **T02: Write idempotent seed script with Vietnamese menu data and 15 tables** `est:25m`
  Configure the seed command in `prisma.config.ts` and write `prisma/seed.ts` with 18 realistic Vietnamese menu items (12 drinks, 6 food) and 15 table records. Verify idempotency and data integrity.
  - Files: `prisma.config.ts`, `prisma/seed.ts`
  - Verify: npx prisma db seed && npx prisma db seed && npx tsx -e "import {PrismaClient} from './generated/prisma/client'; import {PrismaBetterSqlite3} from '@prisma/adapter-better-sqlite3'; const p = new PrismaClient({adapter: new PrismaBetterSqlite3({url:'file:prisma/dev.db'})}); const [m,t] = await Promise.all([p.menuItem.count(), p.table.count()]); console.log('MenuItems:', m, 'Tables:', t); await p.$disconnect();" && npm run build

## Files Likely Touched

- prisma/schema.prisma
- prisma/dev.db
- prisma/migrations/
- generated/prisma/
- prisma.config.ts
- prisma/seed.ts
