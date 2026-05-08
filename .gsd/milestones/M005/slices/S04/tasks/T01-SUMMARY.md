---
id: T01
parent: S04
milestone: M005
key_files:
  - start.bat
  - start.sh
key_decisions:
  - Created start.bat (Windows batch script) with env validation, npm install check, prisma migrate, and npm run dev
  - Created start.sh (bash script) for macOS/Linux with same functionality
  - Scripts show clear Vietnamese error messages for missing ADMIN_PASSWORD and SHOP_IP
duration: 
verification_result: passed
completed_at: 2026-05-08T04:20:55.228Z
blocker_discovered: false
---

# T01: Created start scripts with env validation

**Created start scripts with env validation**

## What Happened

Created startup scripts for Windows (start.bat) and Mac/Linux (start.sh) that validate required env vars, run prisma migrate, and start the Next.js dev server with clear Vietnamese error messages.

## Verification

start.bat and start.sh exist; vitest run passes

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run` | 0 | ✅ pass | 1200ms |

## Deviations

None

## Known Issues

None

## Files Created/Modified

- `start.bat`
- `start.sh`
