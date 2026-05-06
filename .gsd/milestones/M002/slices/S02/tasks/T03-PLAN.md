---
estimated_steps: 31
estimated_files: 4
skills_used: []
---

# T03: Order Creation API + Submission + Confirmation

Build the POST /api/order Route Handler, wire cart submission, and build the confirmation screen.

**Steps:**
1. Create `src/app/api/order/route.ts` as a Route Handler:
   - POST endpoint accepting JSON: `{ tableId: number, items: { menuItemId: number, quantity: number, notes?: string }[] }`
   - Validate request body shape (return 400 with Vietnamese error for malformed)
   - Validate table exists: `prisma.table.findUnique({ where: { id: tableId } })` → 404 if not found
   - Validate all items: fetch menuItems by IDs, check they exist and are available
   - Reject unavailable items: return 409 with `{ error: 'Một số món đã hết hàng', unavailableItems: [...] }`
   - Reject invalid quantities: must be positive integers
   - Compute totalAmount server-side: sum of (menuItem.price × quantity) for each item
   - Create Order + OrderItems in Prisma transaction:
     ```
     prisma.$transaction(async (tx) => {
       const order = await tx.order.create({ data: { tableId, totalAmount, status: 'PENDING' } })
       await tx.orderItem.createMany({ data: items.map(i => ({ orderId: order.id, menuItemId: i.menuItemId, quantity: i.quantity, notes: i.notes || '', status: 'PENDING' })) })
       return order with items
     })
     ```
   - Return 201 with `{ order: { id, totalAmount, status, items: [...] } }`
2. Wire submission in CartSheet:
   - 'Gửi đơn' button calls POST /api/order with cart data
   - Loading state during submission (button disabled, spinner or text change)
   - On success: clear cart, show confirmation
   - On failure: show inline error toast 'Không gửi được đơn. Vui lòng thử lại.' — cart preserved
   - Handle unavailable items error: highlight problem items in cart
3. Create `src/components/order/OrderConfirmation.tsx` as a Client Component:
   - Shows after successful order submission
   - Displays: 'Đặt món thành công!' heading, order summary (items, quantities, total), table number
   - 'Gọi thêm món' button → resets view to menu (not page navigation, just state change)
   - Staggered fadeSlideUp entrance animation on confirmation content
4. Manage view state in the order page: menu → confirmation → menu (via state, not routing)

## Inputs

- `src/components/order/CartProvider.tsx (cart state)`
- `src/components/order/CartSheet.tsx (submission trigger from T02)`
- `src/lib/prisma.ts (PrismaClient singleton)`
- `prisma/schema.prisma (Order, OrderItem models)`
- `src/lib/format.ts (VND formatter for confirmation display)`

## Expected Output

- `src/app/api/order/route.ts`
- `src/components/order/CartSheet.tsx (updated with submission logic)`
- `src/components/order/OrderConfirmation.tsx`
- `src/app/order/page.tsx (updated with view state management)`

## Verification

- `next build` completes without type errors
- POST /api/order with valid payload → 201, Order + OrderItems in DB with correct FKs
- POST /api/order with invalid tableId → 404
- POST /api/order with unavailable menuItemId → 409
- POST /api/order with quantity 0 or negative → 400
- Full UI flow at 375px: add items → open cart → add notes → submit → confirmation shows
- Tap 'Gọi thêm món' → back to menu → submit another order → two separate Order records in DB
- Server-computed totalAmount matches expected sum of (price × qty)
- Cart cleared after successful submission
- Error toast on submission failure with cart preserved
