---
estimated_steps: 3
estimated_files: 2
skills_used: []
---

# T01: Create startup scripts with env validation

Create start.bat (Windows) and start.sh (Mac/Linux) scripts that validate required env vars (ADMIN_PASSWORD, SHOP_IP, SHOP_PORT), run prisma migrate deploy, and start the Next.js dev server. Show clear Vietnamese error messages if env vars are missing or invalid.

**Files:** start.bat, start.sh

**Verification:** Run start.bat without ADMIN_PASSWORD → shows Vietnamese error. Run with env vars set → app starts successfully. build succeeds.

## Inputs

- `Next.js app structure`
- `Prisma schema`

## Expected Output

- `start.bat`
- `start.sh`

## Verification

start.bat works on Windows; start.sh works on Mac/Linux
