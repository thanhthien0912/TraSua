---
estimated_steps: 22
estimated_files: 4
skills_used: []
---

# T03: Checkout page UI — table list + bill detail + payment

1. Add 4th tab to StaffNav (src/app/staff/StaffNav.tsx):
   - Add { href: '/staff/checkout', label: 'Tính tiền', emoji: '💰' } to NAV_ITEMS array

2. Create checkout page (src/app/staff/checkout/page.tsx):
   - Fetch list of tables with unpaid orders: GET /api/staff/tables/bill (new endpoint listing all tables, or client-side fetch all tables then filter)
   - Alternative: create a GET /api/staff/checkout endpoint that returns tables with unpaid order counts and totals
   - Display: card per table showing table name + provisional total
   - Empty state: 'Tất cả bàn đã thanh toán! 🎉'
   - Tap table → show BillView detail

3. Create BillView component (src/components/staff/BillView.tsx):
   - Fetch bill data from GET /api/staff/tables/[tableId]/bill
   - Display aggregated items: name, quantity, price (formatVND), status badge
   - Cancelled items: line-through text + 'Huỷ' badge, excluded from total
   - Items with status PENDING/PREPARING/READY: show cancel button (two-tap pattern from OrderCard)
   - Cancel calls existing PATCH endpoint → refetch bill data
   - Total display: bold, large, formatVND
   - 'Đã thanh toán' button at bottom with two-tap confirmation (tap 1: 'Xác nhận thanh toán?' with 3s auto-reset)
   - Pay calls POST /api/staff/tables/[tableId]/pay → navigate back to table list → table disappears

4. Vietnamese labels throughout:
   - Page title: 'Tính tiền'
   - Empty state: 'Tất cả bàn đã thanh toán!'
   - Pay button: 'Đã thanh toán' → 'Xác nhận thanh toán?'
   - Cancel confirm: same as existing OrderCard pattern

## Inputs

- `src/app/staff/StaffNav.tsx (current 3-item nav)`
- `src/components/staff/OrderCard.tsx (two-tap pattern reference)`
- `src/components/staff/StationView.tsx (layout pattern reference)`
- `src/lib/format.ts (formatVND)`
- `src/app/api/staff/tables/[tableId]/bill/route.ts (from T02)`
- `src/app/api/staff/tables/[tableId]/pay/route.ts (from T02)`

## Expected Output

- `Updated src/app/staff/StaffNav.tsx with 4th tab`
- `src/app/staff/checkout/page.tsx`
- `src/components/staff/BillView.tsx`
- `src/app/api/staff/checkout/route.ts (table list endpoint)`

## Verification

npx next build && open http://localhost:3000/staff/checkout in browser → verify tab visible, table list renders, bill detail works
