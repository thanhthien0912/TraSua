---
id: T02
parent: S02
milestone: M003
key_files:
  - src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts
  - src/lib/order-status.ts
  - src/lib/__tests__/cancel-recalculation.test.ts
key_decisions:
  - Always update both status and totalAmount unconditionally (not gated on status change) to prevent stale totals
duration: 
verification_result: passed
completed_at: 2026-05-06T06:13:18.186Z
blocker_discovered: false
---

# T02: PATCH cancel endpoint now recalculates totalAmount excluding cancelled items; added calculateOrderTotal helper with 8 unit tests

**PATCH cancel endpoint now recalculates totalAmount excluding cancelled items; added calculateOrderTotal helper with 8 unit tests**

## What Happened

The PATCH endpoint at `/api/staff/orders/[orderId]/items/[itemId]` already supported `{action: 'cancel'}` and transitioned items to CANCELLED, but did not recalculate the order's `totalAmount`. This task fixed that gap.

1. **Added `calculateOrderTotal` pure helper** to `src/lib/order-status.ts` — sums `price * quantity` for all non-CANCELLED items. Prices are Int (VND, no decimals per MEM013).

2. **Fixed PATCH endpoint** — modified the `allItems` query to `include: { menuItem: { select: { price: true } } }` so item prices are available. After deriving order status, the endpoint now computes `recalculatedTotal` via `calculateOrderTotal` and always updates both `status` AND `totalAmount` together (unconditionally, not gated on status change) to keep them in sync.

3. **Removed conditional order update** — the old code only updated the order when `status !== derivedStatus`. The new code always writes both fields, ensuring totalAmount is correct even when status doesn't change (e.g., cancelling one of several PENDING items keeps status as PENDING but reduces the total).

4. **SSE broadcast unchanged** — the broadcast already re-fetches `fullOrder` after the update, so the new `totalAmount` is automatically included.

5. **Created 8 unit tests** in `cancel-recalculation.test.ts` covering: mixed cancel, all cancelled, no cancelled, single cancelled, price=0, empty array, quantity>1, and mixed statuses with SERVED.

## Verification

Ran `npx vitest run` — all 62 tests pass (54 existing + 8 new). No regressions.

Test suites:
- `cancel-recalculation.test.ts` — 8 tests ✅
- `order-status.test.ts` — 43 tests ✅
- `sse.test.ts` — 11 tests ✅

Verified staff layout/kitchen/overview pages exist (verification gate failures were due to Windows not having `test -f` command).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run` | 0 | ✅ pass | 283ms |
| 2 | `ls src/app/staff/kitchen/page.tsx src/app/staff/page.tsx src/app/staff/layout.tsx` | 0 | ✅ pass | 50ms |

## Deviations

None.

## Known Issues

Verification gate uses `test -f` which doesn't exist on Windows. Future verification commands should use cross-platform alternatives like `ls` or `node -e`.

## Files Created/Modified

- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`
- `src/lib/order-status.ts`
- `src/lib/__tests__/cancel-recalculation.test.ts`
