---
id: S02
parent: M004
milestone: M004
provides:
  - ["GET /api/staff/menu endpoint returning all menu items sorted by sortOrder", "POST /api/staff/orders/[orderId]/items endpoint for adding items to orders", "MenuPickerModal component with DRINK/FOOD tabs and quantity selector", "BillView integration with add-item button and modal"]
requires:
  - slice: S01
    provides: BillView component, bill aggregation API, checkout tab infrastructure
affects:
  []
key_files:
  - ["src/app/api/staff/menu/route.ts", "src/app/api/staff/orders/[orderId]/items/route.ts", "src/lib/__tests__/add-item-api.test.ts", "src/components/staff/MenuPickerModal.tsx", "src/components/staff/BillView.tsx"]
key_decisions:
  - ["Reuse item-status-change SSE event type for add-item broadcasts — stations already handle this, no new event type needed", "Bottom-sheet modal pattern for MenuPickerModal — better for mobile/tablet thumb reach than centered dialog", "Single-item selection with inline quantity selector — simpler than multi-item cart for quick staff add-item workflow", "prisma.$transaction wrapping createMany + recalculate + re-fetch for atomic consistency"]
patterns_established:
  - ["Bottom-sheet menu picker modal for staff item selection", "Reuse existing SSE event types when new operations produce compatible payloads", "fetchBill() refresh on modal success + SSE belt-and-suspenders redundancy"]
observability_surfaces:
  - ["Console logs on add-item API: orderId, item count, new totalAmount", "Console logs on menu API: item count returned", "SSE broadcast logging reuses existing item-status-change path"]
drill_down_paths:
  - [".gsd/milestones/M004/slices/S02/tasks/T01-SUMMARY.md", ".gsd/milestones/M004/slices/S02/tasks/T02-SUMMARY.md"]
duration: ""
verification_result: passed
completed_at: 2026-05-06T08:15:13.845Z
blocker_discovered: false
---

# S02: Add Items from Bill

**Staff can add menu items to a table's latest unpaid order from the bill detail view via a bottom-sheet MenuPickerModal with DRINK/FOOD tabs, quantity selector, and full SSE propagation to bar/kitchen stations**

## What Happened

This slice delivered the add-item half of R008 — the last missing piece of the bill management workflow.

**T01: API Endpoints + Unit Tests** — Created two new API routes. `GET /api/staff/menu` returns all menu items sorted by sortOrder with id, name, price, category, available fields. `POST /api/staff/orders/[orderId]/items` accepts `{ items: [{ menuItemId, quantity, notes? }] }` with a full validation chain: body shape (400), quantity positivity (400), orderId existence (404), PAID guard (409), menuItem existence (400), availability (409 with unavailableItems array). On success, it creates OrderItems via `prisma.$transaction` wrapping createMany + calculateOrderTotal + deriveOrderStatus + re-fetch, then broadcasts `item-status-change` SSE event (reusing the existing event type so stations need zero client-side changes). Returns enriched order with 201 status. 14 new unit tests cover calculateOrderTotal with newly added PENDING items, large VND values, all-cancelled + new items, deriveOrderStatus after adding PENDING items to orders in various states, and PAID guard logic.

**T02: MenuPickerModal + BillView Integration** — Created `MenuPickerModal.tsx` as a bottom-sheet-style modal (slide-up from bottom, matching the cart sheet UX pattern). The modal fetches the menu from GET /api/staff/menu, presents DRINK/FOOD tabs with role=tablist/tab/tabpanel, shows unavailable items greyed out with 'Hết hàng' badge (disabled), supports single-item selection with quantity +/- controls, optional notes input, and submits via the add-item API. Handles 409 responses with Vietnamese error messages. Modified `BillView.tsx` to add a '+ Thêm món' button that opens the modal with the latest unpaid orderId, and calls fetchBill() on success for immediate visual feedback. SSE listener provides belt-and-suspenders redundancy.

All 111 tests pass (97 existing + 14 new). Next build succeeds cleanly. Both new routes appear in build output.

## Verification

**T01 verification (executor-verified):** `npx vitest run` — 111 tests pass across 8 test files (exit 0, 1861ms). `npx next build` — compiled successfully, both /api/staff/menu and /api/staff/orders/[orderId]/items routes appear in build output (exit 0, 11284ms).

**T02 verification (executor-verified):** `npx vitest run` — 111 tests pass across 8 test files (exit 0, 4500ms). `npx next build` — compiled with Turbopack, TypeScript check passed, all 18 pages generated (exit 0, 11800ms). Grep-verified: DRINK/FOOD tabs with tablist role, Hết hàng badge, quantity +/- buttons, POST to add-item API, 409 error handling, 44px+ touch targets, Vietnamese labels, active:scale-[0.96], tabular-nums, formatVND, zero CartProvider/useCart imports, BillView has Thêm món button and MenuPickerModal render with onSuccess={fetchBill}.

**Slice-level verification:** All 111 tests pass. Build clean. Both API endpoints compile and route correctly. UI integration confirmed via grep pattern checks. No regressions in existing 97 tests.

## Requirements Advanced

None.

## Requirements Validated

- R008 — Both halves delivered: cancel items (M003/S02, extended in M004/S01) and add items (M004/S02 via MenuPickerModal + add-item API). Staff can cancel or add items from the bill dashboard with SSE propagation. 111 tests pass.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None. Both tasks implemented exactly as planned.

## Known Limitations

No multi-item cart for batch adding — modal supports single-item-at-a-time selection, which is simpler but requires multiple modal opens for adding several items. No optimistic locking for concurrent bill edits. Menu data fetched fresh on each modal open (no caching).

## Follow-ups

None. M004 is complete — all bill & checkout functionality delivered across S01 and S02.

## Files Created/Modified

- `src/app/api/staff/menu/route.ts` — New GET endpoint returning all menu items sorted by sortOrder with id, name, price, category, available fields
- `src/app/api/staff/orders/[orderId]/items/route.ts` — New POST endpoint for adding items to orders with full validation chain, atomic transaction, and SSE broadcast
- `src/lib/__tests__/add-item-api.test.ts` — 14 new unit tests covering calculateOrderTotal with added items, deriveOrderStatus after adds, and PAID guard logic
- `src/components/staff/MenuPickerModal.tsx` — New bottom-sheet modal with DRINK/FOOD tabs, availability badges, quantity selector, and 409 error handling
- `src/components/staff/BillView.tsx` — Added '+ Thêm món' button and MenuPickerModal integration with fetchBill refresh on success
