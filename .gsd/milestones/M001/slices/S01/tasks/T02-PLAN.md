---
estimated_steps: 55
estimated_files: 5
skills_used: []
---

# T02: Initialize Prisma 7 with SQLite adapter and create client singleton

Set up Prisma 7 with SQLite using the new v7 patterns (NOT v5/v6). This directly advances R006 (local operation — SQLite file DB, no external server). Creates the database pipeline: schema → migration → generated client → singleton.

## Steps

1. Run `npx prisma init --datasource-provider sqlite` — this creates `prisma/schema.prisma` with SQLite defaults.
2. **Update `prisma/schema.prisma`** to use Prisma 7 patterns. The generator MUST be:
   ```prisma
   generator client {
     provider = "prisma-client"
     output   = "../generated/prisma"
   }
   
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   **CRITICAL:** Use `prisma-client` NOT `prisma-client-js` (v7 breaking change). Output goes to `../generated/prisma`.
3. Add a minimal model to validate the pipeline (Category is useful for S02):
   ```prisma
   model Category {
     id    Int    @id @default(autoincrement())
     name  String
     type  String // 'drink' or 'food'
   }
   ```
4. Create `.env` file in project root with `DATABASE_URL="file:./prisma/dev.db"` (Prisma reads this for migrations).
5. Run `npx prisma migrate dev --name init` to create the initial migration and generate the client into `generated/prisma/`.
6. Create `src/lib/prisma.ts` — the PrismaClient singleton with better-sqlite3 adapter:
   ```typescript
   import { PrismaClient } from '../../generated/prisma/client'
   import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3'
   
   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
   
   export const prisma = globalForPrisma.prisma ?? new PrismaClient({
     adapter: new PrismaBetterSQLite3({ url: 'file:prisma/dev.db' })
   })
   
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
   ```
   **Note:** The exact import path for the adapter class may vary — check the installed package's exports. The research says `PrismaBetterSqlite3` but verify the actual export name.
7. Update `.gitignore` — add `generated/` if not already present (the scaffold .gitignore won't have it).

## Must-Haves

- [ ] `prisma/schema.prisma` uses `provider = "prisma-client"` (NOT `prisma-client-js`)
- [ ] `prisma/schema.prisma` has `output = "../generated/prisma"`
- [ ] `generated/prisma/` directory exists after migration with client files
- [ ] `prisma/dev.db` exists (SQLite file created by migration)
- [ ] `prisma/migrations/` contains the init migration
- [ ] `src/lib/prisma.ts` exports a singleton PrismaClient with SQLite adapter
- [ ] `.gitignore` includes `generated/` line
- [ ] `.env` contains DATABASE_URL pointing to SQLite file

## Important constraints

- Prisma 7 has breaking changes from v5/v6. Do NOT use old patterns.
- The adapter import name might be `PrismaBetterSQLite3` or `PrismaBetterSqlite3` — check the actual package exports and use the correct casing.
- If `prisma migrate dev` fails, check that the schema uses `prisma-client` provider and that `.env` has DATABASE_URL set.
- SQLite URL format: `file:./prisma/dev.db` (relative to project root in .env) or `file:prisma/dev.db` (in code).

## Inputs

- ``package.json` — must have prisma and @prisma/client installed (from T01)`
- ``.gitignore` — needs generated/ added`

## Expected Output

- ``prisma/schema.prisma` — Prisma 7 schema with SQLite + Category model`
- ``src/lib/prisma.ts` — PrismaClient singleton with better-sqlite3 adapter`
- ``.env` — DATABASE_URL for SQLite`
- ``generated/prisma/` — auto-generated Prisma client`
- ``prisma/dev.db` — SQLite database file`
- ``prisma/migrations/` — initial migration files`
- ``.gitignore` — updated with generated/ entry`

## Verification

npx prisma generate && node -e "const fs=require('fs'); if(!fs.existsSync('generated/prisma'))throw new Error('No generated client'); if(!fs.existsSync('prisma/dev.db'))throw new Error('No SQLite DB'); console.log('Prisma pipeline OK')"
