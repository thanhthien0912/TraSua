---
id: T04
parent: S01
milestone: M005
key_files:
  - src/app/api/admin/menu/__tests__/menu-crud.test.ts
  - src/lib/__tests__/hidden-menu-filter.test.ts
key_decisions:
  - Mock Prisma at module level with vi.mock('@/lib/prisma') and call route handlers directly — consistent with project's unit test pattern (no integration test DB)
  - Test hidden-item precedence over unavailable-item check in order route to verify the ordering contract from T02
duration: 
verification_result: passed
completed_at: 2026-05-06T09:15:23.061Z
blocker_discovered: false
---

# T04: Added 41 tests for admin menu CRUD API routes and hidden-item filtering, bringing total from 111 to 152

**Added 41 tests for admin menu CRUD API routes and hidden-item filtering, bringing total from 111 to 152**

## What Happened

Created two comprehensive test files covering all admin menu API routes and hidden-item filtering behavior.

**menu-crud.test.ts** (31 tests) — Tests all 5 HTTP methods on the admin menu API by mocking `@/lib/prisma` and calling route handlers directly with mock Request objects:
- GET: returns all items including hidden ones, handles DB errors (500)
- POST: creates with valid data (201), validates missing name (400), empty name (400), price ≤ 0 (400), negative price (400), non-integer price (400), invalid category (400), invalid JSON (400), trims whitespace, sets defaults, accepts optional description
- PUT: updates fields (200), 404 for non-existent ID, 400 for NaN ID, validates empty name, price ≤ 0, invalid category, invalid JSON, non-integer sortOrder, non-boolean available
- PATCH: toggles available flag, toggles hidden flag, 404 for non-existent, 400 for invalid field name, 400 for non-boolean value, 400 for invalid ID
- DELETE: soft-deletes by setting hidden=true, 404 for non-existent, 400 for invalid ID

**hidden-menu-filter.test.ts** (10 tests) — Tests hidden-item filtering across customer, staff, and order surfaces:
- Staff menu route uses `{ hidden: false }` filter
- Empty result when all items hidden
- Contract test confirming staff route uses same filter shape as customer page
- Order creation rejects hidden items with 400 (not 409)
- Hidden check runs before unavailable check (precedence)
- Unavailable (non-hidden) returns 409
- Visible+available items create order successfully (201)
- Mixed hidden+visible order rejects entire order
- Missing table returns 404
- Non-existent menu item returns 400

Both test files follow the project's existing pattern: vi.mock for Prisma, direct route handler invocation, and assertion on response status codes and JSON bodies.

## Verification

Ran `npx vitest run --reporter=verbose` — all 152 tests pass across 10 test files (111 existing + 41 new). Target was 125+, exceeded by 27.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run --reporter=verbose` | 0 | ✅ pass | 5000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/app/api/admin/menu/__tests__/menu-crud.test.ts`
- `src/lib/__tests__/hidden-menu-filter.test.ts`
