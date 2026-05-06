import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { broadcast } from '@/lib/sse'
import {
  isValidTransition,
  deriveOrderStatus,
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
  if (!isValidTransition(currentStatus, targetStatus)) {
    console.log(
      `[PATCH /api/staff/orders/${orderId}/items/${itemId}] Invalid transition: ${currentStatus} → ${targetStatus}`
    )
    return NextResponse.json(
      {
        error: `Không thể chuyển trạng thái từ ${currentStatus} sang ${targetStatus}.`,
        currentStatus,
        targetStatus,
      },
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

  // ─── Derive order status and update if changed ────────────────────
  const allItems = await prisma.orderItem.findMany({
    where: { orderId },
  })

  const derivedStatus = deriveOrderStatus(
    allItems.map((i) => i.status as ItemStatus)
  )

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
  })

  if (order.status !== derivedStatus) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: derivedStatus },
    })
    console.log(
      `[PATCH /api/staff/orders/${orderId}/items/${itemId}] Order status updated: ${order.status} → ${derivedStatus}`
    )
  }

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

  // Broadcast to all stations (no station filter — every station sees item changes
  // and can update its own view accordingly)
  broadcast('item-status-change', enrichedOrder)

  return NextResponse.json(enrichedOrder)
}
