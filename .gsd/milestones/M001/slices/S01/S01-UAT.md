# S01: Next.js + Tailwind + Prisma Setup — UAT

**Milestone:** M001
**Written:** 2026-05-06T02:38:40.227Z

# S01: Next.js + Tailwind + Prisma Setup — UAT

**Milestone:** M001
**Written:** 2026-05-06

## UAT Type

- UAT mode: mixed (artifact-driven + live-runtime)
- Why this mode is sufficient: This is a foundation/scaffold slice — the key deliverable is a working dev toolchain and a visible landing page. Artifact checks confirm the pipeline, live-runtime confirms the page renders.

## Preconditions

- Node.js 18+ installed
- Working directory is D:/TraSua with all dependencies installed (`npm install` completed)
- No external database or internet connection required

## Smoke Test

Run `npm run dev`, open http://localhost:3000 in a browser — should see a Vietnamese TraSua landing page with amber/tea-house branding and a bubble tea emoji.

## Test Cases

### 1. Build pipeline completes clean

1. Run `npm run build` in the project root
2. **Expected:** Build exits with code 0, generates static pages for `/` and `/_not-found`

### 2. TypeScript compilation has zero errors

1. Run `npx tsc --noEmit`
2. **Expected:** Exits with code 0, no error output

### 3. Prisma client generation works

1. Run `npx prisma generate`
2. Check that `generated/prisma/` directory exists and contains `client.ts`
3. **Expected:** Command succeeds, generated client files present

### 4. SQLite database exists after migration

1. Check for `prisma/dev.db` file
2. Check for `prisma/migrations/` directory with at least one migration
3. **Expected:** Both exist; dev.db is a valid SQLite file

### 5. Landing page has Vietnamese content and TraSua branding

1. Run `npm run dev`
2. Open http://localhost:3000
3. **Expected:** Page displays Vietnamese text ("Đặt Món", "Thực đơn"), TraSua branding, and bubble tea emoji (🧋)

### 6. HTML root has lang="vi" attribute

1. View page source or inspect the `<html>` element
2. **Expected:** `<html lang="vi">` is present

### 7. Mobile-first responsive layout

1. Open http://localhost:3000 in a 375px-wide viewport (iPhone SE)
2. **Expected:** Feature cards stack vertically, text is readable, no horizontal scrollbar
3. Widen viewport to 1280px
4. **Expected:** Cards display in a 3-column grid

### 8. No external font or CDN dependencies (R006)

1. Open DevTools Network tab, reload the page
2. **Expected:** No requests to Google Fonts, CDNs, or any external domain. All resources served locally.

## Edge Cases

### Empty database with no seed data

1. The database has only the Category table from the init migration with no rows
2. **Expected:** Landing page renders fine — it does not query the database (that's S02's concern)

### No internet connection

1. Disconnect from internet, run `npm run dev`, open localhost:3000
2. **Expected:** Page loads normally — no external dependencies (R006 compliance)

## Failure Signals

- `npm run build` fails → dependency or TypeScript issue
- `npx prisma generate` fails → schema or Prisma config broken
- `prisma/dev.db` missing → migration didn't run
- Page shows default Next.js scaffold instead of TraSua branding → T03 landing page not applied
- Google font requests in Network tab → R006 violation

## Not Proven By This UAT

- Database CRUD operations (no seed data yet — deferred to S02)
- QR code generation (deferred to S03)
- Real menu display or order flow (future milestones)
- Multi-device testing beyond viewport resize
- Production deployment or performance under load

## Notes for Tester

- 5 moderate npm audit vulnerabilities exist in the Next.js/ESLint dependency tree — these are upstream issues and not blocking for development
- The Category model in the schema is a placeholder for S02 seed data work
- prisma.config.ts is a Prisma 7 convention (not v5/v6) — don't be surprised if it looks unfamiliar
