# S04: Deployment Readiness

**Goal:** Prepare the app for deployment: create start script, validate env vars, write Vietnamese README, and ensure migration runs on boot.
**Demo:** Owner runs start.bat on Windows shop machine. Script validates env vars, runs migration, builds, and starts the app. If ADMIN_PASSWORD is missing, a clear Vietnamese error appears. Vietnamese README guides a non-developer through Node.js install, env setup, seed, and launch.

## Must-Haves

- Owner runs start.bat on Windows shop machine. Script validates env vars, runs migration, builds, and starts the app. If ADMIN_PASSWORD is missing, a clear Vietnamese error appears. Vietnamese README guides a non-developer through Node.js install, env setup, seed, and launch.

## Proof Level

- This slice proves: contract

## Integration Closure

S04 is the final slice. It wraps S01-S03 into a deployable package. No downstream slices.

## Verification

- Startup script validates env vars and shows clear errors if missing.

## Tasks

- [x] **T01: Create startup scripts with env validation** `est:30m`
  Create start.bat (Windows) and start.sh (Mac/Linux) scripts that validate required env vars (ADMIN_PASSWORD, SHOP_IP, SHOP_PORT), run prisma migrate deploy, and start the Next.js dev server. Show clear Vietnamese error messages if env vars are missing or invalid.
  - Files: `start.bat`, `start.sh`
  - Verify: start.bat works on Windows; start.sh works on Mac/Linux

- [x] **T02: Add env validation on boot** `est:20m`
  Add env var validation at app startup (next.config.js or middleware) that checks ADMIN_PASSWORD, SHOP_IP are set and shows clear Vietnamese error if missing. Add error boundary for missing env vars.
  - Files: `next.config.ts`, `src/middleware.ts`
  - Verify: App shows Vietnamese error if ADMIN_PASSWORD missing; build succeeds

- [x] **T03: Write Vietnamese README with setup guide** `est:30m`
  Write Vietnamese README.md that guides a non-developer through: installing Node.js, setting up .env, running migrations, seeding database, and starting the app. Use clear step-by-step format.
  - Files: `README.md`
  - Verify: README exists and covers all setup steps in Vietnamese

- [x] **T04: Verify all tests pass** `est:15m`
  Run all tests to ensure deployment readiness changes don't break existing functionality.
  - Files: `All modified files`
  - Verify: npx vitest run passes; npx next build succeeds

## Files Likely Touched

- start.bat
- start.sh
- next.config.ts
- src/middleware.ts
- README.md
- All modified files
