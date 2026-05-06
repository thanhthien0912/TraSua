# S02 — Add Items from Bill — Research

**Date:** 2025-07-11
**Depth:** Targeted — known tech, established patterns, one new component + one new endpoint.

## Summary

S02 adds a menu picker modal to the bill detail view so staff can add items to a table's latest unpaid order without navigating away. This extends R008 (staff can add items from dashboard) into the bill context. The work is purely additive atop S01's proven BillView component and bill aggregation API.

The main implementation pieces are:
1. **Menu API endpoint** — client-side fetch for menu items (currently only fetched server-side in the order page).
2. **Add-item API endpoint** — POST to add OrderItems to an existing order, with validation reused from POST /api/order.
3. **MenuPickerModal component** — modal with DRINK/FOOD tabs, item selection, quantity input, submit.
4. **BillView integration** — "+ Thêm món" button opens the modal, submit triggers API + bill refetch.

No schema changes needed. No new SSE event types needed — the existing `item-status-change` broadcast from the add-item API handles station updates. The existing bill refetch mechanism in BillView handles bill total updates.

## Recommendation

**Build order: API first (menu GET + add-item POST), then modal UI, then wire into BillView.**

1. **GET /api/staff/menu** — simple endpoint returning all menu items (reuse the same Prisma query from the order page). Needed before the modal can render.
2. **POST /api/staff/orders/[orderId]/items** — adds items to an existing order. Reuse validation from POST /api/order (menuItem existence, availability 409, quantity > 0). Recalculate totalAmount. Broadcast enriched order via SSE. Guard: reject if order is PAID (same pattern as item PATCH).
3. **MenuPickerModal** — adapt MenuView's DRINK/FOOD tab pattern but simplified: no cart, no CartProvider dependency. Direct quantity input per item + submit. Modal overlay with exit animation.
4. **BillView integration** — add "+ Thêm món" button below the items list. On submit, POST to add-item API, then refetch bill.

**Which order receives new items:** Latest unpaid order for the table (decided in MEM064). The add-item API receives an orderId — the BillView must resolve the latest unpaid order from the bill data it already has (`bill.orders` is sorted by `createdAt: 'asc'`, so the last element is the latest).

## Implementation Landscape

### Existing Files to Modify

- **`src/components/staff/BillView.tsx`** (289 lines) — Add "+ Thêm món" button + state to toggle MenuPickerModal open/closed. Pass `tableId` and latest `orderId` to the modal. On successful add, call `fetchBill()` to refresh.
- **`src/app/staff/checkout/page.tsx`** (196 lines) — No changes needed. BillView handles everything internally.

### New Files to Create

- **`src/app/api/staff/menu/route.ts`** — GET endpoint returning all menu items sorted by sortOrder. Simple Prisma query, same as the server-side fetch in `/order/page.tsx` but as an API route for client-side consumption.
- **`src/app/api/staff/orders/[orderId]/items/route.ts`** — POST endpoint to add items to an existing order. Validation chain:
  - Parse body: `{ items: [{ menuItemId, quantity, notes? }] }`
  - Validate orderId exists + order is not PAID (409 guard, same as item PATCH)
  - Validate menuItem existence (400) + availability (409 with unavailableItems)
  - Validate quantity > 0 (400)
  - Create OrderItems in transaction
  - Recalculate order totalAmount + update derived status
  - Refetch full order with items + menuItem + table
  - Broadcast `item-status-change` SSE event (not a new event type — stations handle this to show new items)
  - Return enriched order
- **`src/components/staff/MenuPickerModal.tsx`** — Modal component:
  - Fetches menu data from GET /api/staff/menu on mount
  - DRINK/FOOD tabs (reuse tab pattern from MenuView)
  - Item list with name, price, availability badge
  - Quantity selector per item (default 1, +/- buttons)
  - Optional notes input
  - Submit button → POST to add-item API
  - Overlay backdrop with click-outside to dismiss
  - Loading/error states
  - Vietnamese labels throughout

### Key Patterns to Follow

- **Tab pattern:** Reuse from `src/components/order/MenuView.tsx` — `TABS` array with key/label, `activeTab` state, `role="tablist"` + `role="tab"` + `role="tabpanel"` for accessibility.
- **Validation chain:** Reuse from `src/app/api/order/route.ts` — menuItem existence check, availability 409, quantity validation, server-side total computation.
- **SSE broadcast:** Use `broadcast('item-status-change', enrichedOrder)` after adding items — stations already handle this event type to update their views.
- **PAID guard:** Check `order.status === 'PAID'` before allowing add — same pattern as item PATCH in `[itemId]/route.ts`.
- **Bill refetch:** BillView already has `fetchBill()` that refetches via GET /api/staff/tables/[tableId]/bill. Call it after successful add.
- **Total recalculation:** Use `calculateOrderTotal()` from `order-status.ts` after adding items, same as the PATCH endpoint.
- **Two-div modal pattern (container-two-div-pattern):** Outer animated overlay + inner content div.
- **Touch targets (ux-fitts-target-size):** All interactive elements min 44px.
- **Tabular nums (type-tabular-nums-for-data):** `fontVariantNumeric: 'tabular-nums'` on all price displays.
- **Active scale (physics-active-state):** `active:scale-[0.96]` on buttons, consistent with BillView/MenuView.

### Data Flow

```
BillView (has bill.orders) 
  → resolves latestOrderId = bill.orders[bill.orders.length - 1].id
  → opens MenuPickerModal(orderId, tableId, onSuccess)
    → fetches GET /api/staff/menu → renders DRINK/FOOD tabs
    → user picks item + quantity → POST /api/staff/orders/{orderId}/items
      → API validates, creates OrderItems, recalculates total
      → broadcasts SSE item-status-change
    → onSuccess() → BillView.fetchBill() → bill refreshes with new item
```

### Constraints

- **No CartProvider dependency:** The modal must NOT reuse CartProvider/useCart — that's customer-facing with sessionStorage persistence. Staff menu picker is ephemeral.
- **Single-item or multi-item?** For simplicity, support adding ONE item at a time (pick item → set quantity → submit). Staff can tap "+ Thêm món" again for more items. This keeps the modal simple. The API can accept multiple items in the array for future extensibility, but the UI sends one at a time.
- **Menu data freshness:** Fetch menu on modal open, not cached. Menu is small (~18 items per MEM065 context) — no performance concern.
- **Order must exist:** The add-item API requires an existing orderId. If the bill has orders (it must, or BillView wouldn't render), the latest order is guaranteed to exist.
- **CANCELLED order edge case:** The bill API filters `status: { notIn: ['PAID', 'CANCELLED'] }`. So bill.orders will never include CANCELLED orders. The latest order in the bill is safe to add items to.

### Verification Approach

- **Unit tests:**
  - Add-item API validation: missing fields → 400, invalid orderId → 404, PAID order → 409, unavailable menuItem → 409, valid add → 201 + correct total
  - Menu API: returns all menu items sorted by sortOrder
- **Build check:** `npx next build` after all changes
- **Test suite:** All 97 existing tests still pass (no regressions)
- **Manual/E2E:** Open bill → tap "+ Thêm món" → see DRINK/FOOD tabs → select item → set quantity → submit → item appears on bill → total updates → station receives SSE event

### UI/UX Rules (from userinterface-wiki)

- `ux-hicks-minimize-choices` — DRINK/FOOD tabs reduce cognitive load vs showing all 18 items
- `ux-progressive-disclosure` — Modal appears on demand, not cluttering the bill view
- `ux-fitts-target-size` — 44px+ touch targets on all buttons and menu items
- `ux-doherty-under-400ms` — Modal should open instantly, menu data fetch in background
- `ux-peak-end-finish-strong` — Clear success feedback when item is added (bill refreshes with new item visible)
- `timing-under-300ms` — Modal enter/exit animations < 300ms
- `easing-entrance-ease-out` — Modal entrance uses ease-out
- `easing-exit-ease-in` — Modal exit uses ease-in
- `staging-dim-background` — Dim backdrop behind modal
- `type-tabular-nums-for-data` — All prices use tabular-nums
- `physics-active-state` — :active scale on interactive elements
- `visual-border-alpha-colors` — Semi-transparent borders for consistency with existing UI

## Common Pitfalls

- **Don't reuse CartProvider** — The customer cart uses sessionStorage keyed by tableId. Staff add-item is a one-shot server action, not a persistent cart. Build the modal with local state only.
- **Don't create a new SSE event type** — `item-status-change` with the enriched order payload is sufficient. Stations already handle it. Creating a new event would require extending useOrderStream unnecessarily.
- **Don't forget to recalculate order totalAmount** — After adding items, `order.totalAmount` must be updated. Use `calculateOrderTotal()` on all items (same pattern as PATCH endpoint).
- **Don't re-derive order status to overwrite PAID** — The add-item API must guard against PAID orders BEFORE adding items. If the guard passes, `deriveOrderStatus()` runs on the (non-PAID) order's items, which is safe.
- **Unavailable items** — The modal should show unavailable items greyed out with "Hết hàng" badge (same pattern as MenuView), but the API must also validate server-side (menu data can change between modal load and submit).

## Open Risks

- **Low risk — Modal complexity:** The menu picker is the only new UI component. ~18 items with DRINK/FOOD tabs is manageable. No search needed. Risk mitigated by following MenuView's established tab pattern.
- **Low risk — Race condition:** If the table is paid between opening the modal and submitting, the PAID guard on the add-item API returns 409. The modal should handle this gracefully (show error, close modal).

## Forward Intelligence for Planner

### Natural task boundaries:
1. **T01: Menu API + Add-Item API** — Both API endpoints, testable via unit tests before any UI exists. ~1 hour.
2. **T02: MenuPickerModal component** — Standalone UI component, can be developed with mock data. ~1 hour.
3. **T03: BillView integration + E2E verification** — Wire modal into BillView, verify full flow, run test suite. ~30 min.

### Key files per task:
- T01: `src/app/api/staff/menu/route.ts` (new), `src/app/api/staff/orders/[orderId]/items/route.ts` (new)
- T02: `src/components/staff/MenuPickerModal.tsx` (new)
- T03: `src/components/staff/BillView.tsx` (modify), verification

### What unblocks what:
- T01 unblocks T02 (modal needs menu API to fetch data) and T03 (BillView integration needs add-item API)
- T02 and T01 can overlap if the modal uses mock data initially
- T03 depends on both T01 and T02
