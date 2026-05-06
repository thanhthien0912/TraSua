---
id: S01
parent: M001
milestone: M001
provides:
  - ["Next.js 16 app skeleton with working dev server at localhost:3000", "Prisma 7 + SQLite pipeline (schema → migration → generated client → singleton)", "Vietnamese TraSua landing page with mobile-first Tailwind layout", "PrismaClient singleton at src/lib/prisma.ts", "SQLite database at prisma/dev.db", "TypeScript path alias @/* → ./src/*"]
requires:
  []
affects:
  - ["S02", "S03"]
key_files:
  - ["package.json", "src/app/layout.tsx", "src/app/page.tsx", "src/app/globals.css", "prisma/schema.prisma", "prisma.config.ts", "src/lib/prisma.ts", ".env", "next.config.ts", "tsconfig.json"]
key_decisions:
  - ["Used Next.js 16.2.4 + React 19.2.4 + Tailwind CSS v4 + Prisma 7.8.0 (latest stack)", "SQLite via better-sqlite3 adapter for R006 offline constraint — no external DB needed", "System-ui font stack instead of Google Fonts for R006 offline compliance", "PrismaClient singleton on globalThis for HMR survival", "Generated Prisma client at generated/prisma/ (project root, not inside src/)", "Warm amber color palette for tea-house branding"]
patterns_established:
  - ["PrismaClient singleton pattern at src/lib/prisma.ts — all downstream code imports from @/lib/prisma", "Mobile-first Tailwind responsive layout with sm:/md: breakpoints", "Vietnamese-language HTML with lang=vi root attribute", "No external CDN/font dependencies — everything served locally"]
observability_surfaces:
  - none
drill_down_paths:
  - [".gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md", ".gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md", ".gsd/milestones/M001/slices/S01/tasks/T03-SUMMARY.md"]
duration: ""
verification_result: passed
completed_at: 2026-05-06T02:38:40.227Z
blocker_discovered: false
---

# S01: Next.js + Tailwind + Prisma Setup

**Scaffolded a running Next.js 16 + Tailwind v4 + Prisma 7/SQLite app with a Vietnamese TraSua landing page at localhost:3000 — build, typecheck, and database pipeline all green.**

## What Happened

Three tasks delivered the full project foundation end-to-end:

**T01 — Project scaffold:** Created the Next.js 16.2.4 project with React 19.2.4, Tailwind CSS v4, TypeScript, ESLint, and App Router. Worked around create-next-app's rejection of capital-letter directory names by scaffolding into a temp subdirectory and copying up. Installed the Prisma 7.8.0 stack (prisma, @prisma/client, @prisma/adapter-better-sqlite3, better-sqlite3) and dev tooling (tsx, @types/better-sqlite3). All 7 required dependencies confirmed in package.json; npm ls shows clean resolution with no peer dep errors.

**T02 — Prisma 7 + SQLite pipeline:** Ran `prisma init --datasource-provider sqlite` which created the Prisma 7-style schema (prisma-client provider, not prisma-client-js) and the new prisma.config.ts for datasource URL management. Added a Category model as a seed point for S02. Ran `prisma migrate dev --name init` producing prisma/dev.db (SQLite), the migration at prisma/migrations/20260506022924_init/, and the generated client at generated/prisma/. Created the PrismaClient singleton at src/lib/prisma.ts with globalThis caching for HMR survival. Updated .gitignore to exclude generated/.

**T03 — Vietnamese landing page:** Replaced the default scaffold pages with a TraSua-branded Vietnamese-language landing page. Set lang="vi" on the HTML root, removed Google font imports (R006 offline compliance), and applied a warm amber color palette with system fonts. The page features a bubble tea emoji hero, Vietnamese heading and CTAs, and three feature cards. Mobile-first layout using Tailwind sm:/md: breakpoints — cards stack vertically on mobile (375px+) and display in a 3-column grid on desktop. Full-stack verification: tsc --noEmit zero errors, npm run build succeeds, browser renders correctly at both desktop and mobile viewports with no console errors.

## Verification

All 10 slice-level must-have checks passed:

1. ✅ `npm run build` — completes without errors (static generation of / and /_not-found)
2. ✅ `npx prisma generate` — succeeds
3. ✅ `generated/prisma/` directory exists with client files
4. ✅ `npx tsc --noEmit` — zero type errors
5. ✅ `lang="vi"` present in src/app/layout.tsx
6. ✅ TraSua branding present in src/app/page.tsx
7. ✅ `prisma/dev.db` exists (SQLite, no external DB — R006)
8. ✅ 18 responsive breakpoint classes found (mobile-first — R007)
9. ✅ No Google font imports (R006 offline compliance)
10. ✅ `.env` has DATABASE_URL configured for SQLite

Browser verification (from T03): Desktop 1280px and mobile 390px viewports both render correctly with Vietnamese text, TraSua branding, and zero console errors.

## Requirements Advanced

- R006 — SQLite file database (prisma/dev.db) with no external server dependency; no Google fonts or CDN requests — fully offline capable
- R007 — Vietnamese UI with lang=vi, mobile-first Tailwind layout with 18 responsive breakpoint classes, verified at 375px and 1280px viewports

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

Scaffolded into a temp subdirectory due to create-next-app rejecting capital letters in directory names — cosmetic only, end result identical. Prisma 7 init creates prisma.config.ts (not anticipated in plan) — kept as standard v7 pattern.

## Known Limitations

Database has only the Category table with no seed data — S02 adds real menu models and seed. Landing page is a static placeholder — no database queries or dynamic content yet. 5 moderate npm audit vulnerabilities in upstream Next.js/ESLint deps.

## Follow-ups

S02 should add full menu schema models (MenuItem, etc.) and seed 10+ items. S03 can build QR generator page on top of this skeleton. The Category model in schema.prisma is a placeholder — S02 may restructure it.

## Files Created/Modified

- `package.json` — Project manifest with Next.js 16, React 19, Tailwind v4, Prisma 7, SQLite adapter deps
- `tsconfig.json` — TypeScript config with @/* path alias to ./src/*
- `next.config.ts` — Next.js configuration
- `src/app/layout.tsx` — Root layout with lang=vi, Vietnamese metadata, system fonts
- `src/app/page.tsx` — TraSua Vietnamese landing page with mobile-first amber-themed layout
- `src/app/globals.css` — Tailwind imports + amber color scheme, no Google font variables
- `prisma/schema.prisma` — Prisma 7 schema with prisma-client provider, SQLite datasource, Category model
- `prisma.config.ts` — Prisma 7 datasource URL config via dotenv
- `src/lib/prisma.ts` — PrismaClient singleton with globalThis caching for HMR
- `.env` — DATABASE_URL pointing to SQLite file
- `.gitignore` — Excludes generated/, node_modules/, prisma/dev.db
- `prisma/migrations/20260506022924_init/migration.sql` — Initial migration creating Category table
- `package-lock.json` — Lock file for reproducible installs
