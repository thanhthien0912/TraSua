---
id: T04
parent: S01
milestone: M004
key_files:
  - src/components/staff/useOrderStream.ts
  - src/app/staff/checkout/page.tsx
  - src/components/staff/BillView.tsx
  - src/lib/__tests__/bill-aggregation.test.ts
  - src/components/staff/__tests__/orderReducer.test.ts
key_decisions:
  - Exported orderReducer + types for direct unit testing rather than testing through React hook wrappers — simpler, faster, no jsdom dependency needed
  - BillView SSE listener navigates back (onBack) when order-paid event matches current tableId, preventing stale bill display after payment from another device
  - Checkout page SSE supplements existing 10s poll rather than replacing it — belt-and-suspenders for reliability
duration: 
verification_result: passed
completed_at: 2026-05-06T07:48:11.829Z
blocker_discovered: false
---

# T04: Added REMOVE_ORDERS action to useOrderStream reducer, order-paid SSE listener, SSE reactivity to checkout page and BillView, and unit tests for bill aggregation and reducer

**Added REMOVE_ORDERS action to useOrderStream reducer, order-paid SSE listener, SSE reactivity to checkout page and BillView, and unit tests for bill aggregation and reducer**

## What Happened

Extended the useOrderStream hook with a REMOVE_ORDERS reducer action that filters orders by a Set of IDs for O(1) lookup, plus an 'order-paid' SSE event listener that dispatches REMOVE_ORDERS with the paid orderIds — causing paid orders to immediately disappear from bar/kitchen station views without polling.\n\nAdded SSE EventSource connections to both the checkout page and BillView component. The checkout page now listens for order-paid, item-status-change, and new-order events to refetch the table list immediately (in addition to the existing 10s poll). BillView listens for item-status-change to refetch bill data when items are cancelled from another device, and for order-paid to navigate back when the current table is paid from another session.\n\nExported orderReducer, OrderState, and OrderAction types from useOrderStream.ts for unit testing. Created two test files: bill-aggregation.test.ts (7 cases covering multi-order aggregation, cancelled exclusion, empty arrays, and edge cases) and orderReducer.test.ts (9 cases covering REMOVE_ORDERS with partial/full/empty/no-match ID arrays, plus coverage for ADD_ORDER, UPDATE_ORDER, and SET_ORDERS).

## Verification

Ran `npx vitest run --reporter=verbose` — all 97 tests pass across 7 test files (including 16 new tests). Ran `npx next build` — compiled successfully with zero TypeScript errors. All routes render correctly in the build output.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run --reporter=verbose` | 0 | ✅ pass | 4600ms |
| 2 | `npx next build` | 0 | ✅ pass | 13300ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/components/staff/useOrderStream.ts`
- `src/app/staff/checkout/page.tsx`
- `src/components/staff/BillView.tsx`
- `src/lib/__tests__/bill-aggregation.test.ts`
- `src/components/staff/__tests__/orderReducer.test.ts`
