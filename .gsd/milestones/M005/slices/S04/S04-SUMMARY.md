---
id: S04
parent: M005
milestone: M005
provides:
  - start.bat for Windows with auto-install and migration
  - start.sh for Mac/Linux with same functionality
  - Comprehensive Vietnamese README with setup guide and troubleshooting
requires:
  - slice: S01
    provides: S01-S03 consumed by S04
affects:
  []
key_files:
  - start.bat
  - start.sh
  - README.md
key_decisions:
  - Startup scripts validate ADMIN_PASSWORD and SHOP_IP before starting app
  - Clear Vietnamese error messages shown when env vars are missing
  - Scripts auto-install node_modules on first run
  - Scripts run prisma migrate and show database readiness status
patterns_established:
  - Batch script for Windows startup with env validation
  - Bash script for Mac/Linux startup with same functionality
  - Vietnamese README with step-by-step setup guide
  - Env validation before app starts
observability_surfaces:
  - Startup scripts show clear Vietnamese errors for missing env vars
drill_down_paths:
  - .gsd/milestones/M005/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M005/slices/S04/tasks/T03-SUMMARY.md
  - .gsd/milestones/M005/slices/S04/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-05-08T04:21:27.610Z
blocker_discovered: false
---

# S04: Deployment Readiness

**Deployment readiness complete with startup scripts and Vietnamese README**

## What Happened

Completed S04 Deployment Readiness for M005. Created start.bat (Windows) and start.sh (Mac/Linux) startup scripts that validate env vars, run migrations, and start the app. Created comprehensive Vietnamese README with setup guide covering Node.js installation, env configuration, migration, seed, startup instructions, accessing all pages, and troubleshooting. 178 tests pass, build succeeds.

## Verification

Verified by: npx vitest run → 178 tests pass (12 test files). npx next build compiles successfully. start.bat and start.sh exist and are valid scripts.

## Requirements Advanced

- R011: Deployment scripts and documentation — S04 adds start.bat, start.sh, and Vietnamese README

## Requirements Validated

- R008: Deployment readiness — confirmed by startup scripts and README

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

none

## Files Created/Modified

- `start.bat` — Windows startup script with env validation, npm install, prisma migrate, and npm run dev
- `start.sh` — Mac/Linux startup script with same functionality
- `README.md` — Comprehensive Vietnamese README covering Node.js install, env setup, migration, seed, startup, app access, and troubleshooting
