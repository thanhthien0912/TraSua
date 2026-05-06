# S02: Add Items from Bill

**Goal:** Staff can add items to a table's latest unpaid order from the bill detail view via a menu picker modal, completing the add-item half of R008.
**Demo:** On bill detail view, staff taps '+ Thêm món' → modal opens with DRINK/FOOD tabs showing available menu items → selects an item, enters quantity → submits → item appears on bill → total recalculates → bar/kitchen station receives new item via SSE.

## Must-Haves

- GET /api/staff/menu returns all menu items sorted by sortOrder with id, name, price, category, available fields
- POST /api/staff/orders/[orderId]/items creates OrderItems, recalculates totalAmount, derives order status, broadcasts SSE item-status-change
- POST rejects: missing/malformed body → 400, invalid orderId → 404, PAID order → 409, unavailable menuItem → 409, quantity ≤ 0 → 400
- MenuPickerModal renders DRINK/FOOD tabs, shows item availability, provides quantity selector, submits to add-item API
- BillView has '+ Thêm món' button that opens the modal, passing the latest unpaid orderId
- On successful add, bill refreshes with new item visible and total updated
- Bar/kitchen stations receive SSE event with new items automatically
- New unit tests for add-item validation pass; all existing 97 tests pass; `npx next build` succeeds

## Proof Level

- This slice proves: Contract + integration. API validation chain is unit-tested. Full UI→API→SSE flow is build-verified and manually exercisable. Station SSE propagation reuses proven item-status-change pathway — no new event types.

## Integration Closure

Upstream: BillView component (S01), bill aggregation API (S01), SSE broadcast infrastructure (M003), calculateOrderTotal + deriveOrderStatus from order-status.ts (M003). New wiring: MenuPickerModal mounted inside BillView, calling new add-item API, which broadcasts to existing SSE subscribers. After this slice, M004 is complete — no remaining integration work.

## Verification

- Console logs on add-item API: orderId, item count, new totalAmount. Console logs on menu API: item count returned. SSE broadcast logging reuses existing item-status-change path. BillView refetch triggered on modal success provides immediate visual feedback.

## Tasks

- [x] **T01: Create GET /api/staff/menu and POST /api/staff/orders/[orderId]/items endpoints with unit tests** `est:1h`
  Build both API endpoints that power the add-item-from-bill feature, plus unit tests for the add-item validation chain.
  - Files: `src/app/api/staff/menu/route.ts`, `src/app/api/staff/orders/[orderId]/items/route.ts`, `src/lib/__tests__/add-item-api.test.ts`
  - Verify: npx vitest run && npx next build

- [x] **T02: Build MenuPickerModal and wire into BillView with full flow verification** `est:1.5h`
  Create the MenuPickerModal component and integrate it into BillView so staff can add items from the bill detail screen. This task completes the user-facing feature.
  - Files: `src/components/staff/MenuPickerModal.tsx`, `src/components/staff/BillView.tsx`
  - Verify: npx vitest run && npx next build

## Files Likely Touched

- src/app/api/staff/menu/route.ts
- src/app/api/staff/orders/[orderId]/items/route.ts
- src/lib/__tests__/add-item-api.test.ts
- src/components/staff/MenuPickerModal.tsx
- src/components/staff/BillView.tsx
