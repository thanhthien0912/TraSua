---
id: T02
parent: S02
milestone: M004
key_files:
  - src/components/staff/MenuPickerModal.tsx
  - src/components/staff/BillView.tsx
key_decisions:
  - Bottom-sheet modal pattern (slide-up from bottom) instead of centered dialog — better for mobile touch targets and thumb reach on the staff tablet/phone
  - Single-item selection model with inline quantity selector — simpler than multi-item cart for quick staff add-item workflow
  - Exit animation uses setTimeout(200ms) before onClose() to allow CSS transition to complete
duration: 
verification_result: passed
completed_at: 2026-05-06T08:12:33.346Z
blocker_discovered: false
---

# T02: Built MenuPickerModal with DRINK/FOOD tabs, quantity selector, and 409 error handling; wired into BillView with '+ Thêm món' button and fetchBill refresh on success

**Built MenuPickerModal with DRINK/FOOD tabs, quantity selector, and 409 error handling; wired into BillView with '+ Thêm món' button and fetchBill refresh on success**

## What Happened

Created `src/components/staff/MenuPickerModal.tsx` — a bottom-sheet-style modal component that fetches the menu from GET /api/staff/menu, presents DRINK/FOOD tabs (replicating the tab pattern from MenuView with role=tablist/tab/tabpanel), shows unavailable items greyed out with 'Hết hàng' badge (disabled, not selectable), supports single-item selection with quantity +/- controls (min 1), optional notes input, and submits via POST /api/staff/orders/{orderId}/items. The modal handles 409 responses (PAID order or unavailable items) by displaying Vietnamese error messages. UI details: dimmed backdrop (bg-black/40), slide-up enter animation (cubic-bezier ease-out, 300ms), slide-down exit (ease-in, 200ms), click-outside dismiss, all interactive elements at 44px+ touch targets, active:scale-[0.96] on buttons, tabular-nums on all prices via formatVND, amber color palette consistent with the existing design system.

Modified `src/components/staff/BillView.tsx` — added MenuPickerModal import, showMenuPicker state, a '+ Thêm món' button positioned between the items list and the total/pay section, and renders MenuPickerModal with orderId resolved from `bill.orders[bill.orders.length - 1].id` (latest unpaid order). On success, calls fetchBill() to refresh the bill view, and the existing SSE listener for item-status-change provides belt-and-suspenders redundancy.

No CartProvider or useCart dependency — the modal uses purely local state per MEM033 constraint.

## Verification

Ran `npx vitest run` — all 111 tests pass (8 test files, including 14 add-item API tests from T01). Ran `npx next build` — compiled successfully with Turbopack, TypeScript check passed, all 18 pages generated. Verified all must-haves via grep: DRINK/FOOD tabs with tablist role, Hết hàng badge for unavailable items, quantity +/- buttons, POST to add-item API, 409 error handling, dimmed backdrop, 44px+ touch targets (5 instances), Vietnamese labels (5 instances), active:scale-[0.96] (7 instances), tabular-nums (3 instances), formatVND (4 instances), zero CartProvider/useCart imports, BillView has Thêm món button and MenuPickerModal render with onSuccess={fetchBill}.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run` | 0 | ✅ pass | 4500ms |
| 2 | `npx next build` | 0 | ✅ pass | 11800ms |

## Deviations

None. Implementation follows the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `src/components/staff/MenuPickerModal.tsx`
- `src/components/staff/BillView.tsx`
