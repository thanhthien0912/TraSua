# S01: Next.js + Tailwind + Prisma Setup

**Goal:** Scaffold a running Next.js 16 app with Tailwind CSS v4 and Prisma 7 (SQLite), producing a Vietnamese-language landing page at localhost:3000 with a working database pipeline.
**Demo:** Chạy npm run dev → mở localhost:3000 → thấy trang chủ TraSua

## Must-Haves

- `npm run build` completes without errors
- `npx prisma generate` succeeds and `generated/prisma/` directory exists
- `npx tsc --noEmit` reports zero type errors
- Dev server at localhost:3000 serves a page containing Vietnamese text and "TraSua" branding
- `src/app/layout.tsx` has `lang="vi"` on the root html element
- `prisma/dev.db` exists after migration (SQLite, no external DB — R006)
- Page renders correctly at 375px viewport width (mobile-first — R007)

## Proof Level

- This slice proves: This slice proves: contract-level (dev toolchain works end-to-end). Real runtime required: yes (dev server must start). Human/UAT required: no.

## Integration Closure

Upstream surfaces consumed: none (greenfield). New wiring: Next.js app skeleton, Prisma client singleton at `src/lib/prisma.ts`, SQLite database at `prisma/dev.db`. What remains: S02 adds real schema models and seed data, S03 adds QR generator page.

## Verification

- Run the task and slice verification checks for this slice.

## Tasks

- [x] **T01: Scaffold Next.js 16 project and install all dependencies** `est:15m`
  Create the entire project skeleton using create-next-app and install Prisma 7 + SQLite adapter dependencies. This is the foundation task — every other task depends on package.json and the Next.js file structure existing.
  - Files: `package.json`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `next.config.ts`
  - Verify: node -e "const p=require('./package.json'); const deps={...p.dependencies,...p.devDependencies}; ['next','react','tailwindcss','prisma','@prisma/client','@prisma/adapter-better-sqlite3','tsx'].forEach(d=>{if(!deps[d])throw new Error('Missing: '+d)}); console.log('All deps present')"

- [x] **T02: Initialize Prisma 7 with SQLite adapter and create client singleton** `est:20m`
  Set up Prisma 7 with SQLite using the new v7 patterns (NOT v5/v6). This directly advances R006 (local operation — SQLite file DB, no external server). Creates the database pipeline: schema → migration → generated client → singleton.
  - Files: `prisma/schema.prisma`, `src/lib/prisma.ts`, `.gitignore`, `.env`, `prisma/migrations/`
  - Verify: npx prisma generate && node -e "const fs=require('fs'); if(!fs.existsSync('generated/prisma'))throw new Error('No generated client'); if(!fs.existsSync('prisma/dev.db'))throw new Error('No SQLite DB'); console.log('Prisma pipeline OK')"

- [x] **T03: Build Vietnamese TraSua landing page and verify full stack** `est:15m`
  Replace the default Next.js home page with a TraSua-branded Vietnamese landing page. This directly advances R007 (Vietnamese UI, mobile-first). Also serves as full-stack verification — confirms Next.js + Tailwind + Prisma all work together.
  - Files: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
  - Verify: npx tsc --noEmit && npm run build && node -e "const fs=require('fs');const p=fs.readFileSync('src/app/layout.tsx','utf8');if(!p.includes('lang=\"vi\"'))throw new Error('Missing lang=vi');const pg=fs.readFileSync('src/app/page.tsx','utf8');if(!pg.includes('TraSua'))throw new Error('Missing TraSua branding');console.log('Landing page OK')"

## Files Likely Touched

- package.json
- tsconfig.json
- src/app/layout.tsx
- src/app/page.tsx
- src/app/globals.css
- next.config.ts
- prisma/schema.prisma
- src/lib/prisma.ts
- .gitignore
- .env
- prisma/migrations/
