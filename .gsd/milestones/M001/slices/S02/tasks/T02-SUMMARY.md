---
id: T02
parent: S02
milestone: M001
key_files:
  - prisma.config.ts
  - prisma/seed.ts
  - prisma/dev.db
key_decisions:
  - Used deleteMany in reverse FK order for idempotency rather than upsert — simpler for seed data that doesn't need ID stability
  - Used Promise.all for parallel creates within each category for performance
duration: 
verification_result: passed
completed_at: 2026-05-06T03:09:00.915Z
blocker_discovered: false
---

# T02: Created idempotent seed script with 18 Vietnamese menu items (12 drinks, 6 food) and 15 tables, configured seed command in prisma.config.ts

**Created idempotent seed script with 18 Vietnamese menu items (12 drinks, 6 food) and 15 tables, configured seed command in prisma.config.ts**

## What Happened

Added the `seed` command to `prisma.config.ts` migrations block pointing to `npx tsx prisma/seed.ts`. Created `prisma/seed.ts` following the adapter pattern from `src/lib/prisma.ts` — standalone PrismaClient with PrismaBetterSqlite3 adapter pointing to `file:prisma/dev.db`.

The seed script:
1. Clears all tables in reverse dependency order (orderItem → order → menuItem → table) to ensure idempotency and avoid FK constraint violations.
2. Seeds 12 DRINK items with Vietnamese names and VND Int prices (25000–40000 range): Trà sữa trân châu, Trà sữa matcha, Trà sữa socola, Trà sữa khoai môn, Trà đào cam sả, Trà vải, Trà chanh leo, Cà phê sữa đá, Sinh tố bơ, Sinh tố xoài, Nước ép cam, Soda chanh.
3. Seeds 6 FOOD items: Bánh tráng trộn, Khoai tây chiên, Gà viên chiên, Xúc xích nướng, Bánh mì bơ tỏi, Phô mai que.
4. Sets sequential sortOrder within each category.
5. Seeds 15 tables numbered 1–15 with names "Bàn 1" through "Bàn 15".
6. Logs summary and disconnects PrismaClient in finally block.

Import path uses relative `../generated/prisma/client` (not `@/` alias) since seed runs outside Next.js context.

## Verification

1. Ran `npx prisma db seed` — succeeded, output "Seeded 18 menu items and 15 tables".
2. Ran `npx prisma db seed` a second time — succeeded with identical output, confirming idempotency (deleteMany + recreate pattern works).
3. Ran verification script querying counts — confirmed MenuItems: 18 (Drinks: 12, Foods: 6), Tables: 15.
4. Ran `npm run build` — Next.js 16.2.4 compiled successfully, TypeScript passed, static pages generated.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx prisma db seed (first run)` | 0 | ✅ pass | 4000ms |
| 2 | `npx prisma db seed (second run — idempotency)` | 0 | ✅ pass | 4000ms |
| 3 | `npx tsx prisma/verify-seed.ts (count verification)` | 0 | ✅ pass | 2000ms |
| 4 | `npm run build` | 0 | ✅ pass | 7000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `prisma.config.ts`
- `prisma/seed.ts`
- `prisma/dev.db`
