---
id: T03
parent: S02
milestone: M003
key_files:
  - src/components/staff/OrderCard.tsx
key_decisions:
  - Cancel button uses {action: 'cancel'} body (matching T02 backend convention) not {status: 'CANCELLED'}
  - CANCELLABLE_STATUSES defined as Set for O(1) lookup — includes PENDING, PREPARING, READY
  - 3-second auto-reset timer managed via useEffect+useRef to prevent stale confirm buttons
duration: 
verification_result: passed
completed_at: 2026-05-06T06:15:30.426Z
blocker_discovered: false
---

# T03: Added cancel button with two-tap confirmation to OrderCard ItemRow — first tap shows 'Xác nhận huỷ?', second tap sends PATCH cancel, resets after 3s timeout

**Added cancel button with two-tap confirmation to OrderCard ItemRow — first tap shows 'Xác nhận huỷ?', second tap sends PATCH cancel, resets after 3s timeout**

## What Happened

Added a cancel button to the `ItemRow` component in `OrderCard.tsx` that completes the cancel flow started by T02's backend work.\n\n**Implementation:**\n- Defined `CANCELLABLE_STATUSES` set containing PENDING, PREPARING, READY — cancel button only renders for these statuses, hidden for SERVED and CANCELLED.\n- Added `confirmingCancel` state with `useRef` timer for 3-second auto-reset. First tap enters confirmation mode (red solid button with 'Xác nhận huỷ?' text), second tap executes the cancel via `PATCH {action: 'cancel'}`.\n- `useEffect` manages the timeout lifecycle — sets 3s timer when `confirmingCancel` becomes true, cleans up on unmount or state change.\n- Cancel button styling: normal state uses `bg-red-50 text-red-600 ring-1 ring-red-200` (destructive but subtle), confirming state uses `bg-red-600 text-white` (solid red, unmistakable). Both meet 44px min-height touch target.\n- The cancel handler uses `{action: 'cancel'}` body shape (not `{status: 'CANCELLED'}`) per the T02 backend convention, which triggers the `calculateOrderTotal` recalculation.\n- After cancel, SSE broadcasts the update and `useOrderStream` re-renders the item with CANCELLED status — `getValidNextStatuses('CANCELLED')` returns `[]` so no action buttons appear, and the existing Huỷ badge renders.\n- Loading spinner shared with advance buttons prevents double-submission during cancel.

## Verification

TypeScript compiles cleanly (only `.next/dev/types/` auto-generated noise, zero source errors). All 62 tests pass across 3 test files (cancel-recalculation, order-status, SSE) with no failures.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass (only .next/dev/types auto-gen errors, zero source errors) | 8000ms |
| 2 | `npx vitest run` | 0 | ✅ pass — 62 tests passed, 3 test files, 0 failures | 3000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/components/staff/OrderCard.tsx`
