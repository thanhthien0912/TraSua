---
estimated_steps: 17
estimated_files: 6
skills_used: []
---

# T01: Scaffold Next.js 16 project and install all dependencies

Create the entire project skeleton using create-next-app and install Prisma 7 + SQLite adapter dependencies. This is the foundation task — every other task depends on package.json and the Next.js file structure existing.

## Steps

1. Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*" --yes` in the project root `D:/TraSua`. The directory has `.git`, `.gitignore`, `.gsd` files — the `--yes` flag handles the non-empty directory prompt.
2. Verify the scaffold succeeded: `package.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `tsconfig.json` must all exist.
3. Install Prisma and SQLite adapter: `npm install prisma @prisma/client @prisma/adapter-better-sqlite3 better-sqlite3`
4. Install dev dependencies: `npm install -D tsx @types/better-sqlite3`
5. Verify all deps installed: `npm ls prisma @prisma/client @prisma/adapter-better-sqlite3` should show versions without errors.

## Must-Haves

- [ ] `package.json` exists with next, react, tailwindcss, prisma, @prisma/client, @prisma/adapter-better-sqlite3 as dependencies
- [ ] `src/app/layout.tsx` and `src/app/page.tsx` exist (created by scaffold)
- [ ] `node_modules/` populated, `npm ls` shows no missing peer deps
- [ ] `tsconfig.json` has `@/*` path alias configured

## Important constraints

- Do NOT use yarn or pnpm — use npm (`--use-npm` flag)
- Do NOT modify the scaffold output in this task (layout/page changes are T03)
- If create-next-app prompts about non-empty directory, the `--yes` flag should auto-accept. If it still fails, try removing the conflict or using explicit prompt answers.
- The project root is `D:/TraSua` — scaffold INTO this directory, not a subdirectory

## Inputs

- `.gitignore`

## Expected Output

- ``package.json` — project manifest with all required dependencies`
- ``tsconfig.json` — TypeScript config with @/* alias`
- ``src/app/layout.tsx` — root layout (scaffold default)`
- ``src/app/page.tsx` — home page (scaffold default)`
- ``src/app/globals.css` — Tailwind v4 CSS imports`
- ``next.config.ts` — Next.js configuration`
- ``package-lock.json` — lockfile from npm install`

## Verification

node -e "const p=require('./package.json'); const deps={...p.dependencies,...p.devDependencies}; ['next','react','tailwindcss','prisma','@prisma/client','@prisma/adapter-better-sqlite3','tsx'].forEach(d=>{if(!deps[d])throw new Error('Missing: '+d)}); console.log('All deps present')"
