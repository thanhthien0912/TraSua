---
id: T01
parent: S02
milestone: M001
key_files:
  - prisma/schema.prisma
  - prisma/migrations/20260506024910_add_full_schema/migration.sql
  - generated/prisma/models.ts
  - generated/prisma/enums.ts
key_decisions:
  - Used @@map() on all 4 models to avoid SQL reserved word conflicts
  - Used Int for all price fields (VND has no decimal usage)
  - Deleted old database and migrations before running new migration to avoid drift with placeholder schema
duration: 
verification_result: passed
completed_at: 2026-05-06T02:50:32.377Z
blocker_discovered: false
---

# T01: Replaced placeholder Category model with full ordering schema (4 models, 3 enums) and ran SQLite migration successfully

**Replaced placeholder Category model with full ordering schema (4 models, 3 enums) and ran SQLite migration successfully**

## What Happened

Rewrote `prisma/schema.prisma` to replace the placeholder Category model with the full ordering system schema:

**3 Enums:**
- `Category` (DRINK, FOOD)
- `OrderStatus` (PENDING, CONFIRMED, PREPARING, READY, SERVED, PAID, CANCELLED)
- `ItemStatus` (PENDING, PREPARING, READY, SERVED, CANCELLED)

**4 Models:**
- `MenuItem` → `menu_items` — id, name, category (enum), price (Int for VND), description?, available, sortOrder, createdAt, orderItems relation
- `Table` → `tables` — id, number (unique), name (e.g. "Bàn 1"), orders relation
- `Order` → `orders` — id, tableId, table relation, status (enum), totalAmount (Int), createdAt, items relation
- `OrderItem` → `order_items` — id, orderId, order relation, menuItemId, menuItem relation, quantity, status (enum), notes?, createdAt

All models use `@@map()` to avoid SQL reserved word conflicts with `Order` and `Table`. Price fields use Int (VND has no decimals). No `@updatedAt` (SQLite incompatible).

Deleted the old database and migrations to avoid drift, then ran `npx prisma migrate dev --name add_full_schema` which created a clean migration with all 4 tables and proper foreign keys. Regenerated the Prisma client at `generated/prisma/` — confirmed all model types and enum exports are present. `npx tsc --noEmit` passes with zero errors.

## Verification

1. `npx prisma migrate dev --name add_full_schema` — succeeded, created migration SQL with all 4 tables (menu_items, tables, orders, order_items), foreign keys, and unique index on tables.number
2. `npx prisma generate` — succeeded, generated client at generated/prisma/ with MenuItem, Table, Order, OrderItem model types and Category, OrderStatus, ItemStatus enum exports
3. `npx tsc --noEmit` — passed with zero errors, confirming src/lib/prisma.ts and all other code compiles cleanly with the new schema
4. Manual verification of migration.sql — confirmed Int types for price/totalAmount, TEXT for enums (expected SQLite behavior), proper FOREIGN KEY constraints, and UNIQUE INDEX on tables.number

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx prisma migrate dev --name add_full_schema` | 0 | ✅ pass | 8000ms |
| 2 | `npx prisma generate` | 0 | ✅ pass | 2000ms |
| 3 | `npx tsc --noEmit` | 0 | ✅ pass | 5000ms |

## Deviations

Also deleted old migrations directory (not just dev.db) since the placeholder Category model migration was incompatible with the new schema — cleaner to start fresh.

## Known Issues

None.

## Files Created/Modified

- `prisma/schema.prisma`
- `prisma/migrations/20260506024910_add_full_schema/migration.sql`
- `generated/prisma/models.ts`
- `generated/prisma/enums.ts`
