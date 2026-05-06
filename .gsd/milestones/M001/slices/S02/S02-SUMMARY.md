---
id: S02
parent: M001
milestone: M001
provides:
  - ["Full ordering schema (MenuItem, Table, Order, OrderItem models)", "3 enums (Category, OrderStatus, ItemStatus) for type-safe status tracking", "18 Vietnamese menu items (12 DRINK, 6 FOOD) with VND prices", "15 table records (Bàn 1 through Bàn 15)", "Idempotent seed command via npx prisma db seed"]
requires:
  []
affects:
  []
key_files:
  - ["prisma/schema.prisma", "prisma/seed.ts", "prisma.config.ts", "prisma/migrations/20260506024910_add_full_schema/migration.sql", "generated/prisma/", "prisma/dev.db"]
key_decisions:
  - ["Used @@map() on all 4 models to avoid SQL reserved word conflicts (Order, Table)", "Int for all price fields — VND has no decimal usage", "deleteMany + recreate for seed idempotency rather than upsert — simpler for seed data without ID stability needs", "Deleted old placeholder migrations entirely rather than incremental migration — cleaner for schema redesign"]
patterns_established:
  - ["Prisma seed pattern: deleteMany in reverse FK order → create with Promise.all", "Scripts outside Next.js use relative imports from generated/prisma/client (no @/ alias)", "Seed command configured in prisma.config.ts migrations block"]
observability_surfaces:
  - none
drill_down_paths:
  - [".gsd/milestones/M001/slices/S02/tasks/T01-SUMMARY.md", ".gsd/milestones/M001/slices/S02/tasks/T02-SUMMARY.md"]
duration: ""
verification_result: passed
completed_at: 2026-05-06T03:13:34.678Z
blocker_discovered: false
---

# S02: Database Schema & Seed Data

**Full ordering schema (4 models, 3 enums) with idempotent seed of 18 Vietnamese menu items and 15 tables in SQLite**

## What Happened

Replaced the placeholder Category-only Prisma schema with a complete ordering system: 4 models (MenuItem, Table, Order, OrderItem) and 3 enums (Category, OrderStatus, ItemStatus). All models use `@@map()` to avoid SQL reserved word conflicts with `Order` and `Table`. Prices are Int (VND has no decimals).

**T01 — Schema & Migration:** Rewrote `prisma/schema.prisma` with the full data model. Deleted the old placeholder migration directory and dev.db to avoid drift, then ran `npx prisma migrate dev --name add_full_schema` which created a clean migration with all 4 tables, foreign keys, and a unique index on `tables.number`. Regenerated the Prisma client at `generated/prisma/`. TypeScript compiles cleanly.

**T02 — Seed Script:** Added the `seed` command to `prisma.config.ts` pointing to `npx tsx prisma/seed.ts`. The seed script uses deleteMany in reverse FK order (orderItem → order → menuItem → table) followed by create for idempotency — simpler than upsert since seed data doesn't need ID stability. Seeds 12 DRINK items (Trà sữa trân châu through Soda chanh, 25000–40000 VND) and 6 FOOD items (Bánh tráng trộn through Phô mai que, 20000–35000 VND), plus 15 tables ("Bàn 1" through "Bàn 15"). Running `npx prisma db seed` twice produces identical results with no errors.

## Verification

**All slice-level verification checks passed:**

1. `npx prisma generate` — ✅ Generated Prisma Client (7.8.0) to ./generated/prisma
2. `npx tsc --noEmit` — ✅ Zero type errors
3. `npx prisma db seed` (run 1) — ✅ "Seeded 18 menu items and 15 tables"
4. `npx prisma db seed` (run 2 — idempotency) — ✅ Identical output, no errors
5. Data query verification — ✅ MenuItems: 18 (Drinks: 12, Foods: 6), Tables: 15
6. Sample data quality — ✅ Vietnamese names ("Trà sữa trân châu"), Int prices (35000 VND), Table name "Bàn 1"
7. `npm run build` (Next.js) — ✅ Compiled successfully, static pages generated
8. Price type confirmation — ✅ typeof price is number and Number.isInteger is true

## Requirements Advanced

- R001 — Database schema now supports the full order flow (MenuItem→OrderItem→Order→Table) needed for QR-to-order pipeline
- R002 — Category enum (DRINK/FOOD) on MenuItem enables automatic bar/kitchen routing
- R003 — OrderStatus and ItemStatus enums establish the status lifecycle (PENDING→PREPARING→READY→SERVED)
- R004 — Order.totalAmount (Int) and table relation enable per-table bill calculation
- R005 — Table model with unique number field provides the anchor for QR→table mapping
- R007 — All menu item names are Vietnamese, prices in VND integers

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

Deleted old migrations directory (not just dev.db) since the placeholder Category model migration was incompatible with the full schema — cleaner to start fresh than attempt incremental migration from placeholder.

## Known Limitations

Order and OrderItem tables exist in schema but have no seed data — they will be populated by the order flow in M002. No @updatedAt fields due to SQLite compatibility limitation.

## Follow-ups

None.

## Files Created/Modified

- `prisma/schema.prisma` — Full ordering schema: 4 models (MenuItem, Table, Order, OrderItem) + 3 enums replacing placeholder Category
- `prisma/seed.ts` — Idempotent seed script with 18 Vietnamese menu items and 15 tables
- `prisma.config.ts` — Added seed command pointing to npx tsx prisma/seed.ts
- `prisma/migrations/20260506024910_add_full_schema/migration.sql` — SQLite migration creating all 4 tables with FK constraints
- `prisma/dev.db` — SQLite database populated with seed data
- `generated/prisma/` — Regenerated Prisma client with all model types and enum exports
