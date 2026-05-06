# S02: Database Schema & Seed Data — UAT

**Milestone:** M001
**Written:** 2026-05-06T03:13:34.678Z

# S02: Database Schema & Seed Data — UAT

**Milestone:** M001
**Written:** 2026-05-06

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice delivers schema and seed data only — no runtime API or UI. Verification is fully achievable through CLI commands, type checking, and database queries.

## Preconditions

- Node.js and npm installed
- Project dependencies installed (`npm install`)
- No prior database state required (migration creates fresh)

## Smoke Test

Run `npx prisma db seed` → should output "Seeded 18 menu items and 15 tables" with exit code 0.

## Test Cases

### 1. Migration creates all tables

1. Delete `prisma/dev.db` if it exists
2. Run `npx prisma migrate dev`
3. **Expected:** Migration applies successfully. Database file `prisma/dev.db` is created with tables: `menu_items`, `tables`, `orders`, `order_items`.

### 2. Prisma client generates all types

1. Run `npx prisma generate`
2. Check `generated/prisma/` directory
3. **Expected:** Client generated with exports for `MenuItem`, `Table`, `Order`, `OrderItem` models and `Category`, `OrderStatus`, `ItemStatus` enums.

### 3. TypeScript compiles with new schema

1. Run `npx tsc --noEmit`
2. **Expected:** Zero type errors. All existing code (including `src/lib/prisma.ts`) compiles cleanly with the new schema.

### 4. Seed populates correct data

1. Run `npx prisma db seed`
2. Query `menuItem.count()` → **Expected:** 18
3. Query `menuItem.count({ where: { category: 'DRINK' } })` → **Expected:** 12
4. Query `menuItem.count({ where: { category: 'FOOD' } })` → **Expected:** 6
5. Query `table.count()` → **Expected:** 15

### 5. Seed is idempotent

1. Run `npx prisma db seed` twice in succession
2. **Expected:** Both runs succeed with exit code 0. Second run produces identical counts (18 items, 15 tables) — no duplicates, no constraint violations.

### 6. Data quality — Vietnamese names and VND prices

1. Query a sample DRINK item
2. **Expected:** Name is Vietnamese (e.g. "Trà sữa trân châu"), price is an integer (e.g. 35000), no decimals.
3. Query table with number=1
4. **Expected:** Name is "Bàn 1"

### 7. Next.js build still works

1. Run `npm run build`
2. **Expected:** Build succeeds with no errors. Static pages generate correctly.

## Edge Cases

### Empty database seed

1. Drop all data manually (`deleteMany` on all tables)
2. Run `npx prisma db seed`
3. **Expected:** Full data restored — 18 menu items, 15 tables.

### Seed after partial data

1. Manually insert 1 extra menu item
2. Run `npx prisma db seed`
3. **Expected:** deleteMany clears all existing data first, then seeds fresh 18 items + 15 tables. The extra item is gone.

## Failure Signals

- `npx prisma migrate dev` fails → schema syntax error or migration conflict
- `npx tsc --noEmit` reports errors → generated client types don't match usage in src/
- `npx prisma db seed` fails → seed script import error, FK constraint violation, or adapter issue
- `npm run build` fails → schema/client changes broke Next.js compilation
- Count mismatch → seed script logic error (duplicate creates, missing items)

## Not Proven By This UAT

- No runtime API routes tested — menu/order API endpoints come in M002
- No customer UI rendering verified — customer order flow is M002
- No Order/OrderItem creation tested — only MenuItem and Table are seeded; order flow is future work
- No concurrent access testing — SQLite single-writer behavior under load not tested
- No migration rollback tested

## Notes for Tester

- The seed uses `deleteMany` (destructive) — do not run on a production database with real order data.
- SQLite stores enums as TEXT, not native enum types — this is expected Prisma/SQLite behavior.
- If Prisma client generation fails, check that `generated/prisma/` directory exists and is not gitignored.
