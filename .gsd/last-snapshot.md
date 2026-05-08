# GSD context snapshot (2026-05-08T09:42:37.171Z)

## Top project memories
- [MEM005] (gotcha) Prisma 7 adapter for better-sqlite3 exports `PrismaBetterSqlite3` (capital S, lowercase qlite3) — NOT `PrismaBetterSQLite3` as some docs suggest. Verified from @prisma/adapter-better-sqlite3@7.8.0 type definitions.
- [MEM008] (architecture) Prisma 7 adapter export is PrismaBetterSqlite3 (capital S, lowercase qlite3). Prisma 7 generates prisma.config.ts for datasource URL management. Output path is generated/prisma at project root, not inside src/.
- [MEM010] (pattern) PrismaClient singleton pattern in src/lib/prisma.ts caches the client on globalThis in non-production to survive HMR reloads. All downstream code should import from '@/lib/prisma' rather than creating new PrismaClient instances.
- [MEM011] (environment) TraSua project stack: Next.js 16.2.4 + React 19.2.4 + Tailwind CSS v4 + Prisma 7.8.0 + better-sqlite3 + SQLite. TypeScript strict. Dev database at prisma/dev.db. Path alias @/* → ./src/*.
- [MEM013] (architecture) Prisma schema uses @@map() on all 4 models (MenuItem→menu_items, Table→tables, Order→orders, OrderItem→order_items) to avoid SQL reserved word conflicts with Table and Order. All price fields are Int (VND has no decimals).
- [MEM021] (gotcha) Windows environment lacks grep — use findstr for string searching in files, or use Node.js fs.readFileSync + .includes() in gsd_exec for cross-platform verification checks.

## Recent gsd_exec runs
- [e4598f71-8c74-4d6c-bf8b-7ba92be25f5b] node exit:1 — Check tables and unpaid orders count
- [06db86ac-0a86-4f41-ba73-51b71b320131] bash exit:-4058 — check table API routes
- [930f271a-bb96-4cef-bc6d-c444e524d34e] bash exit:-4058 — check existing QR route
- [7b6fc1f5-a105-4b08-8d15-327f6b9be4d4] bash exit:-4058 — check task plan files
- [fcd6c6ea-dea1-4fcc-bf6c-fcc884a5f29a] node exit:0 — delete T05-PLAN.md and list task files
