# S01 — Next.js + Tailwind + Prisma Setup — Research

**Date:** 2025-07-10

## Summary

This is a greenfield project setup — the working directory contains only `.git`, `.gitignore`, and `.gsd` artifacts. No `package.json`, no source files. The slice scaffolds a Next.js 16 app with Tailwind CSS v4 and initializes Prisma 7 with SQLite, producing a running dev server on localhost:3000.

**Key version findings:** Next.js 16.2.4, Tailwind CSS 4.2.4, and Prisma 7.8.0 are current. Prisma 7 has breaking changes from v5/v6 — the generator provider is now `prisma-client` (not `prisma-client-js`), the datasource URL moves to `prisma.config.ts`, client output goes to `generated/prisma/`, and SQLite requires the `@prisma/adapter-better-sqlite3` driver adapter. These patterns are confirmed from Prisma's own sandbox examples.

`create-next-app@latest` defaults to TypeScript + Tailwind CSS + App Router + ESLint, which matches our stack exactly. Running with `--yes` or explicit flags skips all prompts.

## Recommendation

Use `create-next-app@latest` to scaffold the project (into `.` since the directory exists), then `npx prisma init --datasource-provider sqlite` to add Prisma. Manually adjust the generated Prisma files to use the Prisma 7 pattern (prisma.config.ts, adapter-based client). This is the fastest path with the least manual wiring.

**Do NOT use Prisma 5/6 patterns** — the `prisma-client-js` generator and `url` in schema.prisma are deprecated in v7.

## Implementation Landscape

### Key Files

After scaffolding, the project structure will be:

- `package.json` — created by create-next-app; needs prisma deps added
- `src/app/layout.tsx` — root layout (created by scaffold, set `lang="vi"` for R007)
- `src/app/page.tsx` — home page (replace default with TraSua landing)
- `src/app/globals.css` — Tailwind v4 imports (created by scaffold via `@import "tailwindcss"`)
- `tailwind.config.ts` — Tailwind v4 may use CSS-based config; check scaffold output
- `prisma/schema.prisma` — Prisma 7 schema with `provider = "prisma-client"`, `output = "../generated/prisma"`, `datasource db { provider = "sqlite" }`
- `prisma.config.ts` — Prisma 7 config: `defineConfig({ datasource: { url: 'file:prisma/dev.db' }, migrations: { seed: 'npx tsx prisma/seed.ts' } })`
- `src/lib/prisma.ts` — singleton PrismaClient with adapter pattern
- `generated/prisma/` — auto-generated client (add to `.gitignore`)
- `tsconfig.json` — created by scaffold; verify `@/*` alias works

### Prisma 7 Client Singleton Pattern

```typescript
// src/lib/prisma.ts
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../../generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: 'file:prisma/dev.db' })
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Build Order

1. **Scaffold Next.js** — `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*"` — this creates the entire project skeleton. Must run first since everything depends on package.json existing.
2. **Install Prisma deps** — `npm install prisma @prisma/client @prisma/adapter-better-sqlite3` and `npm install -D tsx` (for seed script).
3. **Initialize Prisma** — `npx prisma init --datasource-provider sqlite` — creates `prisma/schema.prisma`. Then manually create `prisma.config.ts` with Prisma 7 pattern.
4. **Adjust schema** — Update generator to `prisma-client` with output `../generated/prisma`. Add a minimal `User` or `Category` model to validate the pipeline.
5. **Generate & migrate** — `npx prisma migrate dev --name init` to create initial migration and generate the client.
6. **Create prisma singleton** — `src/lib/prisma.ts` with adapter pattern.
7. **Update home page** — Replace default Next.js page with a simple TraSua landing page (Vietnamese text).
8. **Update .gitignore** — Add `generated/`, `prisma/dev.db`, `prisma/dev.db-journal`.
9. **Verify** — `npm run dev` → localhost:3000 shows TraSua page.

### Verification Approach

```bash
# 1. Dev server starts without errors
npm run dev
# → Should see "Ready" on localhost:3000

# 2. Home page loads
curl http://localhost:3000
# → Should contain Vietnamese text / TraSua branding

# 3. Prisma client generates successfully
npx prisma generate
# → No errors, generated/ directory populated

# 4. Database migrations apply
npx prisma migrate dev
# → Migration applied, prisma/dev.db exists

# 5. TypeScript compiles
npx tsc --noEmit
# → No type errors
```

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Project scaffolding | `create-next-app@latest` | Generates correct Next.js 16 + Tailwind v4 + TypeScript config in one command |
| Prisma schema init | `prisma init --datasource-provider sqlite` | Creates boilerplate schema; we adjust to v7 patterns after |
| Seed script runner | `tsx` (via npm) | Runs TypeScript seed files directly; configured in prisma.config.ts |
| SQLite driver | `@prisma/adapter-better-sqlite3` | Prisma 7 requires explicit driver adapters for SQLite |

## Common Pitfalls

- **Prisma 7 generator mismatch** — Using `prisma-client-js` (old) instead of `prisma-client` (new) will fail to generate. The schema MUST use `provider = "prisma-client"` and `output = "../generated/prisma"`.
- **Missing prisma.config.ts** — Prisma 7 moves datasource URL out of schema.prisma. Without `prisma.config.ts`, migrations and seed won't know the DB path.
- **SQLite adapter not passed to PrismaClient** — In Prisma 7, SQLite requires `new PrismaClient({ adapter: new PrismaBetterSqlite3(...) })`. Omitting the adapter causes runtime errors.
- **Generated client not in .gitignore** — The `generated/prisma/` directory is auto-generated and should not be committed. Must be added to `.gitignore`.
- **create-next-app in non-empty dir** — The directory has `.git` and `.gsd` files. create-next-app may warn about non-empty directory — use the `--yes` flag or answer prompts to proceed.
- **Tailwind v4 config change** — Tailwind v4 uses CSS-based configuration (`@import "tailwindcss"` in CSS) rather than a separate `tailwind.config.ts`. The scaffold handles this, but custom theme extensions now go in CSS `@theme` blocks, not JS config.

## Constraints

- **R006 (local operation):** SQLite chosen specifically because it requires no external DB server — `file:prisma/dev.db` is a local file. No PostgreSQL, no Docker.
- **Node v24.14.1** is the runtime — this is very new; all deps are compatible (verified: Next.js 16, Prisma 7, Tailwind 4 all support Node 24).
- **Windows (D:\TraSua)** — use cross-platform commands. Prisma SQLite works fine on Windows. `npx tsx` for seed instead of `ts-node` (which has ESM issues on Windows).

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Prisma | `prisma/skills@prisma-database-setup` (7.8K installs) | available — `npx skills add prisma/skills@prisma-database-setup` |
| Prisma | `prisma/skills@prisma-client-api` (7.3K installs) | available — `npx skills add prisma/skills@prisma-client-api` |
| Next.js | built-in `react-best-practices` skill | installed |
| Frontend | built-in `frontend-design` skill | installed |

## Requirements Coverage

This slice establishes the foundation for **all requirements** but directly advances:
- **R006** (local operation) — SQLite + local dev server, no internet dependency
- **R007** (Vietnamese UI, mobile-first) — `lang="vi"` on root layout, Tailwind for responsive design

Downstream slices S02 (schema + seed) and S03 (QR generator) depend on this slice completing successfully.
