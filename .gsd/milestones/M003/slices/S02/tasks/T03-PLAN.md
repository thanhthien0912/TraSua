---
estimated_steps: 28
estimated_files: 1
skills_used: []
---

# T03: Add cancel button with two-tap confirmation to OrderCard ItemRow

Add a cancel button to each item in OrderCard that allows staff to cancel items with a two-tap confirmation UX. This completes the cancel flow: T02 fixed the backend, this task adds the UI trigger.

## Steps

1. In `src/components/staff/OrderCard.tsx`, modify the `ItemRow` component to add a cancel button alongside the existing action buttons.

2. Add state for confirmation mode: `const [confirmingCancel, setConfirmingCancel] = useState(false)`. First tap sets `confirmingCancel = true` and shows 'Xác nhận huỷ?' text. Second tap calls the PATCH endpoint with `{action: 'cancel'}`. Tapping elsewhere or waiting resets the state.

3. The cancel button should appear for items with status PENDING, PREPARING, or READY. Do NOT show for SERVED or CANCELLED items. Implementation: check `status !== 'SERVED' && status !== 'CANCELLED'`.

4. Cancel button styling — destructive/red, visually distinct from the amber action buttons:
   - Normal state: `bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100`
   - Confirming state: `bg-red-600 text-white` with text 'Xác nhận huỷ?'
   - Min height 44px for touch targets

5. The cancel handler sends:
   ```typescript
   fetch(`/api/staff/orders/${orderId}/items/${item.id}`, {
     method: 'PATCH',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ action: 'cancel' }),
   })
   ```

6. After cancellation, the SSE event will update the order in real-time (via useOrderStream). The cancelled item will show the 'Huỷ' badge with red styling and no action buttons (getValidNextStatuses('CANCELLED') returns []).

7. Add a timeout to reset the confirming state after 3 seconds if the user doesn't confirm — prevents stale confirm buttons.

8. Run `npx tsc --noEmit` and `npx vitest run` to verify no regressions.

## Must-Haves

- [ ] Cancel button visible for PENDING, PREPARING, READY items
- [ ] Cancel button hidden for SERVED and CANCELLED items
- [ ] Two-tap confirmation: first tap shows 'Xác nhận huỷ?', second tap sends cancel
- [ ] Confirmation resets after 3 seconds timeout
- [ ] Red/destructive styling distinct from amber action buttons
- [ ] Touch targets ≥44px
- [ ] TypeScript compiles cleanly, all tests pass

## Inputs

- `src/components/staff/OrderCard.tsx`
- `src/lib/order-status.ts`
- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`

## Expected Output

- `src/components/staff/OrderCard.tsx`

## Verification

npx tsc --noEmit && npx vitest run
