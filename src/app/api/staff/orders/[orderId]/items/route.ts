import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  deriveOrderStatus,
  calculateOrderTotal,
  type ItemStatus,
} from '@/lib/order-status'

type AddItemInput = {
  menuItemId: number
  quantity: number
}

type AddItemsBody = {
  items: AddItemInput[]
}

/**
 * POST /api/staff/orders/[orderId]/items
 *
 * Add items to an existing order from the bill detail view.
 * Follows the same validation chain as POST /api/order but
 * operates on an existing order instead of creating a new one.
 *
 * Body: { items: [{ menuItemId: number, quantity: number, notes?: string }] }
 * Returns: enriched order with all items (status 201)
 * Errors:
 *   400 — invalid body, missing menu items
 *   404 — order not found
 *   409 — order is PAID, items unavailable
 *   500 — transaction failure
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId: orderIdStr } = await params
  const orderId = parseInt(orderIdStr, 10)

  if (isNaN(orderId)) {
    return NextResponse.json(
      { error: 'ID đơn hàng không hợp lệ.' },
      { status: 400 }
    )
  }

  // ─── Parse body ───────────────────────────────────────────────────
  let body: AddItemsBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ.' },
      { status: 400 }
    )
  }

  const { items } = body

  // ─── Validate shape ───────────────────────────────────────────────
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Danh sách món không hợp lệ.' },
      { status: 400 }
    )
  }

  // ─── Validate quantities ──────────────────────────────────────────
  for (const item of items) {
    if (
      typeof item.menuItemId !== 'number' ||
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return NextResponse.json(
        { error: 'Số lượng phải là số nguyên dương.' },
        { status: 400 }
      )
    }
  }

  // ─── Validate order exists ────────────────────────────────────────
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  })

  if (!order) {
    return NextResponse.json(
      { error: 'Đơn hàng không tồn tại.' },
      { status: 404 }
    )
  }

  // ─── Guard: reject additions on PAID orders ───────────────────────
  if (order.status === 'PAID') {
    console.log(
      `[POST /api/staff/orders/${orderId}/items] Rejected: order is PAID`
    )
    return NextResponse.json(
      { error: 'Đơn hàng đã thanh toán, không thể thêm món.' },
      { status: 409 }
    )
  }

  // ─── Validate menu items exist ────────────────────────────────────
  const menuItemIds = items.map((i) => i.menuItemId)
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
  })

  const menuItemMap = new Map(menuItems.map((mi) => [mi.id, mi]))

  const missingIds = menuItemIds.filter((id) => !menuItemMap.has(id))
  if (missingIds.length > 0) {
    return NextResponse.json(
      { error: 'Một số món không tồn tại.', missingItems: missingIds },
      { status: 400 }
    )
  }

  // ─── Validate availability ────────────────────────────────────────
  const unavailableItems = items
    .filter((i) => {
      const mi = menuItemMap.get(i.menuItemId)
      return mi && !mi.available
    })
    .map((i) => i.menuItemId)

  if (unavailableItems.length > 0) {
    return NextResponse.json(
      { error: 'Một số món đã hết hàng.', unavailableItems },
      { status: 409 }
    )
  }

  // ─── Create OrderItems + recalculate in transaction ───────────────
  try {
    const enrichedOrder = await prisma.$transaction(async (tx) => {
      // Create new order items
      await tx.orderItem.createMany({
        data: items.map((i) => ({
          orderId,
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          status: 'PENDING',
        })),
      })

      // Fetch ALL order items (existing + new) for total recalculation
      const allItems = await tx.orderItem.findMany({
        where: { orderId },
        include: { menuItem: { select: { price: true } } },
      })

      // Recalculate totalAmount server-side from all items
      const recalculatedTotal = calculateOrderTotal(
        allItems.map((i) => ({
          status: i.status,
          price: i.menuItem.price,
          quantity: i.quantity,
        }))
      )

      // Derive order status from all item statuses
      const derivedStatus = deriveOrderStatus(
        allItems.map((i) => i.status as ItemStatus)
      )

      // Update order with recalculated total and derived status
      await tx.order.update({
        where: { id: orderId },
        data: { totalAmount: recalculatedTotal, status: derivedStatus },
      })

      // Re-fetch full enriched order for response & SSE broadcast
      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
          table: true,
          items: {
            include: {
              menuItem: {
                select: { id: true, name: true, category: true, price: true },
              },
            },
          },
        },
      })
    })

    console.log(
      `[POST /api/staff/orders/${orderId}/items] Added ${items.length} items, ` +
        `new totalAmount=${enrichedOrder.totalAmount}`
    )

    return NextResponse.json(enrichedOrder, { status: 201 })
  } catch (error) {
    console.error(
      `[POST /api/staff/orders/${orderId}/items] Transaction failed:`,
      error
    )
    return NextResponse.json(
      { error: 'Không thể thêm món. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
