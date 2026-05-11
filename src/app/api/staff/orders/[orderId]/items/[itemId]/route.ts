import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { broadcast } from '@/lib/sse'
import {
  deriveOrderStatus,
  calculateOrderTotal,
  type ItemStatus,
} from '@/lib/order-status'

type PatchBody = {
  status?: ItemStatus
  action?: 'cancel'
}

/**
 * PATCH /api/staff/orders/[orderId]/items/[itemId]
 *
 * Update an order item's status. Enforces forward-only transitions.
 * After updating, derives the order-level status and updates if changed.
 * Broadcasts the full updated order to SSE subscribers.
 *
 * Body: { status: "PREPARING" } or { action: "cancel" }
 * Returns: updated order with all items and derived status
 * Errors:
 *   400 — invalid body
 *   404 — item/order not found
 *   409 — invalid status transition
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  const { orderId: orderIdStr, itemId: itemIdStr } = await params
  const orderId = parseInt(orderIdStr, 10)
  const itemId = parseInt(itemIdStr, 10)

  if (isNaN(orderId) || isNaN(itemId)) {
    return NextResponse.json(
      { error: 'ID đơn hàng hoặc ID món không hợp lệ.' },
      { status: 400 }
    )
  }

  // ─── Guard: reject changes on PAID orders ─────────────────────────
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

  if (order.status === 'PAID') {
    console.log(
      `[PATCH /api/staff/orders/${orderId}/items/${itemId}] Rejected: order is PAID`
    )
    return NextResponse.json(
      { error: 'Đơn hàng đã thanh toán, không thể thay đổi.' },
      { status: 409 }
    )
  }

  // ─── Parse body ───────────────────────────────────────────────────
  let body: PatchBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ.' },
      { status: 400 }
    )
  }

  // Resolve target status from body
  const targetStatus: ItemStatus | undefined =
    body.action === 'cancel' ? 'CANCELLED' : body.status

  if (!targetStatus) {
    return NextResponse.json(
      { error: 'Thiếu trường status hoặc action.' },
      { status: 400 }
    )
  }

  console.log(
    `[PATCH /api/staff/orders/${orderId}/items/${itemId}] Attempting transition to ${targetStatus}`
  )

  // ─── Find the item ────────────────────────────────────────────────
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
    include: {
      menuItem: { select: { category: true } },
    },
  })

  if (!item) {
    console.log(
      `[PATCH /api/staff/orders/${orderId}/items/${itemId}] Item not found`
    )
    return NextResponse.json(
      { error: 'Món không tồn tại trong đơn hàng này.' },
      { status: 404 }
    )
  }

  // ─── Validate transition ──────────────────────────────────────────
  const currentStatus = item.status as ItemStatus

  // Chỉ chặn nếu đã terminal (SERVED hoặc CANCELLED)
  if (currentStatus === 'SERVED' || currentStatus === 'CANCELLED') {
    return NextResponse.json(
      { error: `Món đã ở trạng thái ${currentStatus}, không thể thay đổi.` },
      { status: 409 }
    )
  }

  // ─── Update item status ───────────────────────────────────────────
  await prisma.orderItem.update({
    where: { id: itemId },
    data: { status: targetStatus },
  })

  console.log(
    `[PATCH /api/staff/orders/${orderId}/items/${itemId}] Updated: ${currentStatus} → ${targetStatus}`
  )

  // ─── Derive order status + recalculate totalAmount ─────────────────
  const allItems = await prisma.orderItem.findMany({
    where: { orderId },
    include: { menuItem: { select: { price: true } } },
  })

  const derivedStatus = deriveOrderStatus(
    allItems.map((i) => i.status as ItemStatus)
  )

  const recalculatedTotal = calculateOrderTotal(
    allItems.map((i) => ({
      status: i.status,
      price: i.menuItem.price,
      quantity: i.quantity,
    }))
  )

  // Always update both status and totalAmount together to keep them in sync
  await prisma.order.update({
    where: { id: orderId },
    data: { status: derivedStatus, totalAmount: recalculatedTotal },
  })

  console.log(
    `[PATCH /api/staff/orders/${orderId}/items/${itemId}] Order updated: status=${derivedStatus}, totalAmount=${recalculatedTotal}`
  )

  // ─── Fetch full order for response + broadcast ────────────────────
  const fullOrder = await prisma.order.findUniqueOrThrow({
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

  const enrichedOrder = {
    ...fullOrder,
    derivedStatus: deriveOrderStatus(
      fullOrder.items.map((i) => i.status as ItemStatus)
    ),
  }

  // Broadcast to all stations
  broadcast('item-status-change', enrichedOrder)

  return NextResponse.json(enrichedOrder)
}

/**
 * DELETE /api/staff/orders/[orderId]/items/[itemId]
 *
 * Physically removes an item from the order and updates the total.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  const { orderId: orderIdStr, itemId: itemIdStr } = await params
  const orderId = parseInt(orderIdStr, 10)
  const itemId = parseInt(itemIdStr, 10)

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } })
    if (!order) return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 })
    if (order.status === 'PAID') return NextResponse.json({ error: 'Đơn đã thanh toán' }, { status: 409 })

    await prisma.orderItem.delete({ where: { id: itemId } })

    // Recalculate
    const allItems = await prisma.orderItem.findMany({
      where: { orderId },
      include: { menuItem: { select: { price: true } } },
    })

    const newStatus = deriveOrderStatus(allItems.map(i => i.status as ItemStatus))
    const newTotal = calculateOrderTotal(allItems.map(i => ({
      status: i.status,
      price: i.menuItem.price,
      quantity: i.quantity,
    })))

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus, totalAmount: newTotal },
      include: { table: true, items: { include: { menuItem: true } } }
    })

    broadcast('item-status-change', updatedOrder)
    return new Response(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ error: 'Không thể xoá món' }, { status: 500 })
  }
}
