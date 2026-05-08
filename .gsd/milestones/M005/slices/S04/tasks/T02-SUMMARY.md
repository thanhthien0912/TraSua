---
id: T02
parent: S04
milestone: M005
key_files:
  - start.bat
  - start.sh
  - src/middleware.ts
  - src/app/api/admin/login/route.ts
key_decisions:
  - Env validation happens in startup scripts with clear Vietnamese errors
  - ADMIN_PASSWORD and SHOP_IP validated before app starts
  - API routes validate their own inputs and return Vietnamese error messages
duration: 
verification_result: passed
completed_at: 2026-05-08T04:20:55.229Z
blocker_discovered: false
---

# T02: Env validation on boot via startup scripts

**Env validation on boot via startup scripts**

## What Happened

Env validation on boot handled by startup scripts (start.bat/start.sh). Scripts check ADMIN_PASSWORD and SHOP_IP before starting the app. Clear Vietnamese error messages shown if missing.

## Verification

start.bat shows Vietnamese error if ADMIN_PASSWORD missing; build succeeds

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx next build` | 0 | ✅ pass | 30000ms |

## Deviations

None — env validation happens in startup scripts (start.bat/start.sh). The middleware validates admin access, and API routes validate their own inputs.

## Known Issues

None

## Files Created/Modified

- `start.bat`
- `start.sh`
- `src/middleware.ts`
- `src/app/api/admin/login/route.ts`
