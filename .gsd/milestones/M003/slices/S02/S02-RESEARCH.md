# S02 — Kitchen + Overview Stations + Item Cancellation — Research

**Date:** 2025-07-17
**Depth:** Light — straightforward extension of established patterns from S01

## Summary

S02 extends S01's proven bar station to kitchen and overview, adds a shared staff layout with station navigation, and implements item cancellation with totalAmount recalculation. All infrastructure exists — SSE registry, API endpoints, StationView component, OrderCard, useOrderStream hook. The kitchen page is a one-line wrapper (`<StationView station="kitchen" />`), and the overview is `<StationView station="all" />`. The main engineering work is: (1) totalAmount recalculation in the PATCH endpoint when items are cancelled, (2) a cancel button in OrderCard UI, and (3) a staff layout with navigation tabs between the three stations.

## Requirements Targeted

- **R002** — Station filtering already works (verified in S01). Kitchen page using `station='kitchen'` is the proof that FOOD items route to kitchen. This slice completes R002 by making `/staff/kitchen` a real page.
- **R008** (partial) — Item cancellation from dashboard. PATCH endpoint already accepts `{action: 'cancel'}` and transitions items to CANCELLED. **Gap:** totalAmount is NOT recalculated on cancel. This is the only API fix needed.

## Recommendation

**Approach: Thin wrappers + one API fix + cancel UI.**

1. Create kitchen page and overview page as thin StationView wrappers (same pattern as bar)
2. Create staff layout with navigation tabs between the three stations
3. Fix PATCH endpoint to recalculate `order.totalAmount` when an item is cancelled
4. Add cancel button to OrderCard's ItemRow component
5. Verify the full end-to-end flow

## Implementation Landscape

### Existing Files (S01 provides)

| File | What It Does | S02 Action |
|------|-------------|------------|
| `src/components/staff/StationView.tsx` | Reusable station view accepting `station` prop. Filters SERVED/CANCELLED orders. | **Reuse as-is** for kitchen and overview |
| `src/components/staff/OrderCard.tsx` | Renders order card with ItemRow. Action buttons from `getValidNextStatuses()`. Filters CANCELLED from buttons. | **Modify** — add cancel button per item |
| `src/components/staff/useOrderStream.ts` | SSE hook with station filtering, initial fetch, event processing. | **Reuse as-is** — already supports `kitchen` and `all` stations |
| `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts` | PATCH item status + SSE broadcast. Accepts `{action: 'cancel'}`. | **Modify** — add totalAmount recalculation on cancel |
| `src/app/api/staff/orders/route.ts` | GET active orders with station filtering. | **No changes** |
| `src/app/api/staff/orders/stream/route.ts` | SSE endpoint. | **No changes** |
| `src/lib/order-status.ts` | `deriveOrderStatus()`, `isValidTransition()`, `getValidNextStatuses()`. | **No changes** |
| `src/lib/sse.ts` | Subscriber registry, broadcast. | **No changes** |
| `src/app/staff/bar/page.tsx` | Bar station page: `<StationView station="bar" />`. | **No changes** — reference pattern for new pages |

### New Files to Create

| File | What It Does |
|------|-------------|
| `src/app/staff/kitchen/page.tsx` | Kitchen station page: `<StationView station="kitchen" />` with metadata |
| `src/app/staff/page.tsx` | Overview page: `<StationView station="all" />` with metadata |
| `src/app/staff/layout.tsx` | Shared staff layout with navigation tabs (Quầy Bar / Bếp / Tổng quan) |

### Key Modifications

#### 1. PATCH Endpoint — totalAmount Recalculation on Cancel

Current gap: When an item is cancelled, the PATCH endpoint updates item status and derives order status but does NOT recalculate `totalAmount`. The order creation API computes `totalAmount` as `sum(price × quantity)` for all items. On cancel, it should exclude cancelled items.

**Fix location:** `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`

After updating item status (when targetStatus is CANCELLED), add:
```typescript
// After deriving order status, recalculate totalAmount excluding cancelled items
const updatedTotalAmount = allItems.reduce((sum, item) => {
  if (item.status === 'CANCELLED') return sum
  // Need menuItem.price — fetch items with menuItem included
  return sum + item.menuItem.price * item.quantity
}, 0)

await prisma.order.update({
  where: { id: orderId },
  data: { status: derivedStatus, totalAmount: updatedTotalAmount },
})
```

**Important:** The current `allItems` query (`prisma.orderItem.findMany({ where: { orderId } })`) doesn't include `menuItem`. The query needs to be expanded to include `menuItem: { select: { price: true } }` to compute the new total.

#### 2. OrderCard — Cancel Button

Current behavior: `getValidNextStatuses()` returns CANCELLED as a valid next status for most items, but ItemRow explicitly filters it out: `nextStatuses.filter(s => s !== 'CANCELLED')`.

**Fix:** Add a separate cancel button (styled differently — destructive/red) that sends `{action: 'cancel'}` to the PATCH endpoint. The cancel button should have a confirmation step (tap once to reveal "Xác nhận huỷ?", tap again to confirm) to prevent accidental cancellation.

The cancel button should appear for items that are NOT already CANCELLED and NOT SERVED. `getValidNextStatuses('SERVED')` returns `['CANCELLED']`, but the acceptance criteria says SERVED items are done — cancel should only apply to PENDING, PREPARING, and READY items.

#### 3. Staff Layout — Navigation

Create `src/app/staff/layout.tsx` with:
- Navigation bar at the top with three links: Quầy Bar (`/staff/bar`), Bếp (`/staff/kitchen`), Tổng quan (`/staff`)
- Active link highlighted based on current pathname
- Use `usePathname()` from `next/navigation` for active state
- Mark as `'use client'` for the nav component (or extract NavBar as a client component)
- Should be tablet-optimized with large touch targets (44px min)

### Natural Seams for Task Decomposition

1. **Kitchen page + Overview page + Staff layout** (UI-only, no API changes)
   - Create three new files following established patterns
   - Layout requires `usePathname()` — client component needed
   - Verify: dev server renders all three pages, navigation works

2. **Cancel: API fix (totalAmount recalculation)**
   - Modify PATCH endpoint to include menuItem in allItems query
   - Recalculate totalAmount when any item is cancelled (not just when targetStatus is CANCELLED — recalc always to stay correct)
   - Include updated totalAmount in SSE broadcast (already included via enrichedOrder)
   - Verify: curl PATCH cancel → check order.totalAmount decreased → SSE event has new totalAmount

3. **Cancel: UI (cancel button in OrderCard)**
   - Add cancel button to ItemRow with confirmation UX
   - Style as destructive (red/muted)
   - Hide for SERVED and CANCELLED items
   - Verify: tap cancel on an item → item shows CANCELLED status → totalAmount updates on card

### Verification Strategy

- `npx tsc --noEmit` — TypeScript compiles cleanly
- `npx vitest run` — existing 54 tests still pass (no regressions)
- Dev server: `/staff/kitchen` shows FOOD items only
- Dev server: `/staff` overview shows all orders
- Dev server: Navigation tabs work between all three pages
- curl: PATCH cancel item → verify response has updated `totalAmount` excluding cancelled item
- curl: Cancel all items in an order → verify `totalAmount` is 0 and derivedStatus is CANCELLED
- SSE: Cancel broadcasts event with recalculated totalAmount
- E2E: Submit mixed order → bar sees drinks, kitchen sees food, overview sees all → cancel a drink → bar updates, totalAmount decreases

### Constraints

- No schema migrations needed — all models already exist
- StationView already handles `station='all'` correctly (no category filter, shows all items)
- The overview page allows ALL transitions including READY→SERVED (which bar/kitchen don't offer because their items stop at READY). This is correct by design — getValidNextStatuses returns SERVED for READY items, and the overview is where runners mark things served.
- OrderCard should show cancelled items as greyed out with no action buttons — `getValidNextStatuses('CANCELLED')` returns `[]` so action buttons are already hidden for cancelled items.
