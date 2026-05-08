---
estimated_steps: 3
estimated_files: 2
skills_used: []
---

# T02: Add env validation on boot

Add env var validation at app startup (next.config.js or middleware) that checks ADMIN_PASSWORD, SHOP_IP are set and shows clear Vietnamese error if missing. Add error boundary for missing env vars.

**Files:** next.config.ts, src/app/api/admin/login/route.ts

**Verification:** next build succeeds; app shows clear error if ADMIN_PASSWORD is missing

## Inputs

- `start.bat/start.sh scripts`

## Expected Output

- `Env validation on boot`

## Verification

App shows Vietnamese error if ADMIN_PASSWORD missing; build succeeds
