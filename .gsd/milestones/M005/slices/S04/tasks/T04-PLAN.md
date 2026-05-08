---
estimated_steps: 3
estimated_files: 1
skills_used: []
---

# T04: Verify all tests pass

Run all tests to ensure deployment readiness changes don't break existing functionality.

**Files:** All modified files

**Verification:** npx vitest run passes (178+ tests). npx next build succeeds.

## Inputs

- `start.bat, start.sh, env validation, README`

## Expected Output

- `All tests pass after deployment readiness changes`

## Verification

npx vitest run passes; npx next build succeeds
