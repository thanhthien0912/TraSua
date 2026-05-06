# M004 — Bill & Checkout — Research

**Date:** 2025-07-11

## Summary

M004 adds a checkout/billing tab to the staff dashboard, completing the order lifecycle (order → prepare → serve → **pay**). The codebase is well-structured for this addition — the `PAID` value already exists in the `OrderStatus` enum, SSE infrastructure is mature, and existing patterns (two-tap confirm, item cancel, total recalculation) can be directly reused.

The primary implementation challenge is that **PAID is an order-level status, not item-derived**. The current `deriveOrderStatus()` computes order status from item statuses (PENDING/PREPARING/READY/SERVED/CANCELLED). PAID breaks this pattern — it's explicitly set by staff action across all orders for a table, regardless of individual item states. This requires a deliberate design choice: either bypass derivation when marking paid, or treat PAID as an override that takes precedence over derived status. The second challenge is the bill aggregation query — a new endpoint that joins multiple orders per table with their items and menu data.

Everything else maps cleanly to existing patterns: StaffNav is a simple array push, cancel-from-bill reuses the existing PATCH endpoint, SSE broadcast follows the established `broadcast(event, data)` pattern, and the menu picker modal reuses menu data already fetched by the customer order page.

## Recommendation

**Approach: Layered build — schema first, APIs second, UI last.**

1. Start with schema migration (`paidAt` on Order) and order-status module updates — this is the foundation everything else depends on.
2. Build the bill aggregation API and mark-paid API — these can be tested independently via curl/HTTP before any UI exists.
3. Build the checkout page UI (table list → bill detail → payment) last, consuming the proven APIs.

**PAID status handling:** Treat PAID as an **explicit order-level override** that bypasses `deriveOrderStatus()`. When marking paid, directly set `order.status = 'PAID'` and `order.paidAt = now()` without re-deriving from items. The `deriveOrderStatus()` function remains unchanged (it doesn't know about PAID). This is clean because PAID is a business action, not a state derivable from item progress.

**Add item to bill:** Add OrderItems to the **latest unpaid order** for the table (not create a new order). Simpler, keeps order count manageable, and the bill view already aggregates across orders so the user won't notice the difference.

## Implementation Landscape

### Key Files

- **`prisma/schema.prisma`** — Add `paidAt DateTime?` to Order model. `OrderStatus` enum already has `PAID`. Migration needed.
- **`src/lib/order-status.ts`** — Core status logic. `deriveOrderStatus()` stays unchanged (PAID is order-level, not item-derived). `isValidTransition()` is ItemStatus-only — PAID transition validation happens in the API route. `calculateOrderTotal()` is fine as-is (excludes CANCELLED).
- **`src/lib/sse.ts`** — `broadcast(event, data, station?)` is the only function needed. Payment events use no station filter (all stations receive). No changes needed to SSE infrastructure.
- **`src/app/api/staff/orders/route.ts`** — GET endpoint currently excludes `SERVED` and `CANCELLED`. **Must add `PAID` to the exclusion list** so paid orders disappear from station views.
- **`src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`** — Existing PATCH endpoint handles cancel + status transitions + total recalc + SSE broadcast. **Reuse directly** for cancel-from-bill — no changes needed.
- **`src/app/api/order/route.ts`** — POST order creation with full validation chain (table exists, menu items exist, availability, server-side total). **Reuse validation pattern** for add-item-to-bill endpoint.
- **`src/components/staff/useOrderStream.ts`** — SSE hook handles `new-order` and `item-status-change` events. **Extend** with `order-paid` event handler that removes paid orders from state.
- **`src/app/staff/StaffNav.tsx`** — `NAV_ITEMS` array with 3 items. **Push 4th item**: `{ href: '/staff/checkout', label: 'Tính tiền', emoji: '💰' }`.
- **`src/components/staff/OrderCard.tsx`** — Two-tap cancel pattern, item display layout. **Reuse pattern** for bill item rows and "Đã thanh toán" button.
- **`src/components/staff/StationView.tsx`** — `categorizeOrders()`, connection banners, layout. **Reference** for checkout page structure.
- **`src/lib/format.ts`** — `formatVND()` — reuse for bill totals.

### New Files to Create

- **`src/app/staff/checkout/page.tsx`** — Checkout page: table list with unpaid orders
- **`src/components/staff/BillView.tsx`** — Bill detail component: aggregated items, total, cancel/add/pay actions
- **`src/components/staff/MenuPickerModal.tsx`** — Modal for adding items to bill
- **`src/app/api/staff/tables/[tableId]/bill/route.ts`** — GET bill aggregation by table
- **`src/app/api/staff/tables/[tableId]/pay/route.ts`** — POST mark table as paid
- **`src/app/api/staff/orders/[orderId]/items/route.ts`** — POST add item to existing order

### Build Order

**Phase 1: Schema + Status (foundation)**
- Add `paidAt DateTime?` to Order model, run migration
- Add PAID to staff orders exclusion filter (`notIn: ['SERVED', 'CANCELLED', 'PAID']`)
- This is the only blocking dependency — everything else can proceed after this

**Phase 2: Bill APIs (provable without UI)**
- GET `/api/staff/tables/[tableId]/bill` — aggregate all unpaid orders for a table with items + menu data
- POST `/api/staff/tables/[tableId]/pay` — mark all unpaid orders as PAID, set paidAt, broadcast SSE
- POST `/api/staff/orders/[orderId]/items` — add item to existing order (reuse validation from order creation)
- SSE: broadcast `order-paid` event from pay endpoint

**Phase 3: Checkout UI (consumes proven APIs)**
- StaffNav 4th tab
- Checkout page: list tables with unpaid totals
- Bill detail view: aggregated items, cancel buttons, total display
- "Đã thanh toán" button with two-tap confirm
- Menu picker modal for adding items

**Phase 4: SSE Integration (real-time updates)**
- Extend `useOrderStream` to handle `order-paid` event
- Checkout page SSE: live updates when items change on other stations

### Verification Approach

- **Unit tests**: Bill aggregation logic (multi-order same table → correct total, cancelled excluded), PAID transition (SERVED→PAID valid, PAID→anything invalid)
- **API tests**: curl/httpie against bill and pay endpoints with test data
- **E2E**: Create 2 orders on same table → open checkout → verify aggregation → cancel item → verify total → add item → mark paid → verify SSE broadcast → verify stations cleared
- **Build check**: `npx prisma generate && npx next build` after schema migration

## Constraints

- **SQLite single-writer**: Mark-paid updates multiple orders in one transaction. Keep transaction tight — update orders, then broadcast SSE outside the transaction.
- **PAID is order-level, not item-level**: `ItemStatus` enum does NOT have PAID. Only `OrderStatus` has it. The PATCH item endpoint cannot transition items to PAID — it transitions the **order** directly.
- **`deriveOrderStatus()` doesn't know about PAID**: After marking paid, the order.status is set directly to PAID. If any subsequent operation re-derives status from items, it would overwrite PAID back to SERVED/PREPARING. The item PATCH endpoint re-derives status — this is fine because items on a PAID order shouldn't be modified. But the API should reject item modifications on PAID orders as a guard.
- **Staff routes have no auth** (D005): Checkout endpoints follow the same pattern — no auth middleware needed.
- **Vietnamese UI**: All labels, empty states, error messages in Vietnamese.

## Common Pitfalls

- **PAID status overwrite via item PATCH** — If someone PATCHes an item on a PAID order, `deriveOrderStatus()` would re-derive the status and overwrite PAID back to SERVED/PREPARING. **Guard**: Item PATCH endpoint should reject changes to items on PAID orders (check `order.status !== 'PAID'` before processing).
- **Bill aggregation double-counting** — When aggregating items across orders, ensure cancelled items appear in the list (for transparency) but are excluded from the total. `calculateOrderTotal()` already handles this correctly.
- **SSE event naming** — Current events are `new-order` and `item-status-change`. The payment event should be distinct (e.g. `order-paid`) so `useOrderStream` can handle it with a REMOVE action rather than an UPDATE. If we reuse `item-status-change`, the reducer would try to update (not remove) the order.
- **Menu picker stale data** — Menu availability can change between when the picker loads and when the item is submitted. The add-item API should validate availability server-side (same pattern as POST /api/order).
- **Multiple tabs open** — If checkout and station tabs are open simultaneously, paid orders must disappear from both. SSE broadcast to all stations handles this, but the checkout page's own refetch/SSE logic must also update.

## Open Risks

- **Menu picker complexity**: The modal needs to fetch menu data, display DRINK/FOOD tabs, handle quantity input, and submit. This is the most complex new UI component. Risk is moderate — mitigate by keeping it simple (scroll, no search) since the menu is small (~18 items).
- **Race condition on concurrent pay**: If two staff members try to mark the same table as paid simultaneously, the second request should be a no-op (all orders already PAID). The API should handle this gracefully — check for unpaid orders first, return 404 or 200-already-paid if none found.
- **`paidAt` migration on existing data**: Existing orders in SERVED/CANCELLED status won't have `paidAt`. This is fine — `paidAt` is nullable, and only gets set on the PAID transition. But ensure queries don't assume `paidAt` is always set.

## Candidate Requirements Analysis

### Existing requirements covered by M004:
- **R004** (core-capability): "Tính tiền theo bàn" — this is the primary deliverable. M004 directly validates R004.
- **R008** (core-capability): "Huỷ món hoặc thêm món" — M004 extends this to bill view. Currently M003 delivers cancel from station view. M004 adds cancel-from-bill and add-item-from-bill.

### Observations on existing requirements:
- **R002, R003**: Station routing and real-time dashboard — M004 must not break these. The PAID exclusion from staff orders query is the key integration point.
- **R006**: Local network constraint — M004 adds no external dependencies, stays local.
- **R007**: Vietnamese mobile-first — checkout page follows same pattern but is staff-facing (tablet/desktop optimized).

### Candidate new requirements (advisory, not auto-binding):
- **Candidate: PAID terminal state guard** — Prevent item modifications on PAID orders. This is a data integrity concern, not explicitly in R004 but critical for consistency. Recommend including as part of M004 implementation, not as a separate requirement.
- **Candidate: Revenue reporting** — Once orders have PAID status + paidAt timestamps, daily/weekly revenue reports become possible. Explicitly out of scope for M004 per CONTEXT, but the schema supports it. Could become a future requirement.

## Sources

- Codebase analysis: `prisma/schema.prisma`, `src/lib/order-status.ts`, `src/lib/sse.ts`, `src/app/api/staff/orders/route.ts`, `src/app/api/order/route.ts`, `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`, `src/components/staff/useOrderStream.ts`, `src/app/staff/StaffNav.tsx`
