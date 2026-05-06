---
estimated_steps: 47
estimated_files: 2
skills_used: []
---

# T02: Build MenuPickerModal and wire into BillView with full flow verification

Create the MenuPickerModal component and integrate it into BillView so staff can add items from the bill detail screen. This task completes the user-facing feature.

## Steps

1. Create `src/components/staff/MenuPickerModal.tsx` — Modal component with:
   - Props: `orderId: number`, `tableId: number`, `isOpen: boolean`, `onClose: () => void`, `onSuccess: () => void`
   - Fetch menu data from GET /api/staff/menu on mount (when isOpen becomes true)
   - DRINK/FOOD tabs: reuse the tab pattern from `src/components/order/MenuView.tsx` — TABS array with key/label, activeTab state, role='tablist' + role='tab' + role='tabpanel' for accessibility
   - Item list filtered by activeTab category, showing: name, price (formatVND with tabular-nums), availability badge ('Hết hàng' for unavailable, greyed out)
   - Quantity selector: default 1, +/- buttons (min 1), displayed inline per selected item
   - Single item selection model: tap item to select, set quantity, submit. One item at a time keeps it simple (per research constraint).
   - Optional notes text input
   - Submit button: POST to /api/staff/orders/{orderId}/items with `{ items: [{ menuItemId, quantity, notes }] }`
   - Handle 409 response (PAID order or unavailable item) — show error message in Vietnamese
   - On success: call onSuccess() callback, then onClose()
   - Loading state while fetching menu + while submitting
   - Modal overlay: dimmed backdrop (staging-dim-background), click-outside to dismiss
   - Animations: enter ease-out < 300ms, exit ease-in < 300ms (easing-entrance-ease-out, easing-exit-ease-in, timing-under-300ms)
   - Touch targets: all buttons min 44px (ux-fitts-target-size)
   - Active scale: active:scale-[0.96] on interactive elements (physics-active-state)
   - Vietnamese labels throughout: 'Thêm món', 'Đồ uống', 'Đồ ăn', 'Hết hàng', 'Thêm', 'Huỷ', etc.
   - Use local state only — do NOT import CartProvider or useCart (per research constraint/MEM033)

2. Modify `src/components/staff/BillView.tsx` — Add integration:
   - Import MenuPickerModal
   - Add state: `const [showMenuPicker, setShowMenuPicker] = useState(false)`
   - Resolve latest orderId: `bill.orders[bill.orders.length - 1].id` (orders sorted by createdAt asc per bill API)
   - Add '+ Thêm món' button between the items list and the total/pay section. Style: min-h-[44px], amber theme consistent with existing buttons, active:scale-[0.96]
   - Render MenuPickerModal with isOpen={showMenuPicker}, orderId={latestOrderId}, onClose, onSuccess={fetchBill}
   - The existing SSE listener for item-status-change already calls fetchBill(), providing belt-and-suspenders refresh

3. Run full verification: all tests pass (existing 97 + new from T01), build succeeds, no TypeScript errors.

## Must-Haves

- [ ] MenuPickerModal renders DRINK/FOOD tabs with correct items
- [ ] Unavailable items shown greyed out with 'Hết hàng' badge, not selectable
- [ ] Quantity selector works (min 1, +/- buttons)
- [ ] Submit POSTs to add-item API and handles success/error
- [ ] Modal has dimmed backdrop, enter/exit animations, click-outside dismiss
- [ ] All interactive elements have 44px+ touch targets
- [ ] All text in Vietnamese
- [ ] BillView has '+ Thêm món' button that opens the modal
- [ ] Latest orderId correctly resolved from bill.orders
- [ ] On success, bill refreshes showing new item with updated total
- [ ] No CartProvider/useCart dependency — modal uses local state only
- [ ] All tests pass, build clean

## Key patterns to follow
- Tab pattern from `src/components/order/MenuView.tsx` (TABS array, activeTab, role attributes)
- Two-div modal pattern (container-two-div-pattern): outer animated overlay + inner content
- formatVND from `@/lib/format` with fontVariantNumeric: 'tabular-nums' on prices
- Semi-transparent borders: border-amber-200/60 (visual-border-alpha-colors)
- Active scale: active:scale-[0.96] on all buttons

## Inputs

- ``src/app/api/staff/menu/route.ts` — menu API endpoint created in T01`
- ``src/app/api/staff/orders/[orderId]/items/route.ts` — add-item API endpoint created in T01`
- ``src/components/staff/BillView.tsx` — existing bill component to modify`
- ``src/components/order/MenuView.tsx` — DRINK/FOOD tab pattern to replicate`
- ``src/lib/format.ts` — formatVND import`

## Expected Output

- ``src/components/staff/MenuPickerModal.tsx` — new modal component with DRINK/FOOD tabs, quantity selector, submit`
- ``src/components/staff/BillView.tsx` — modified with '+ Thêm món' button and MenuPickerModal integration`

## Verification

npx vitest run && npx next build
