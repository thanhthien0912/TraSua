import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { broadcast } from '@/lib/sse'

type OrderItemInput = {
  menuItemId: number
  quantity: number
}

type OrderRequestBody = {
  tableId: number
  items: OrderItemInput[]
}

export async function POST(request: NextRequest) {
  // ─── Parse body ───────────────────────────────────────────────────
  let body: OrderRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ.' },
      { status: 400 },
    )
  }

  const { tableId, items } = body

  // ─── Validate shape ───────────────────────────────────────────────
  if (
    typeof tableId !== 'number' ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return NextResponse.json(
      { error: 'Dữ liệu đơn hàng không hợp lệ.' },
      { status: 400 },
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
        { status: 400 },
      )
    }
  }

  // ─── Validate table exists ────────────────────────────────────────
  const table = await prisma.table.findUnique({ where: { id: tableId } })
  if (!table) {
    return NextResponse.json(
      { error: 'Bàn không tồn tại.' },
      { status: 404 },
    )
  }

  // ─── Validate menu items exist and are available ──────────────────
  const menuItemIds = items.map((i) => i.menuItemId)
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
  })

  const menuItemMap = new Map(menuItems.map((mi) => [mi.id, mi]))

  // Check for missing items
  const missingIds = menuItemIds.filter((id) => !menuItemMap.has(id))
  if (missingIds.length > 0) {
    return NextResponse.json(
      { error: 'Một số món không tồn tại.', missingItems: missingIds },
      { status: 400 },
    )
  }

  // Check for hidden items (soft-deleted)
  const hiddenItems = items
    .filter((i) => {
      const mi = menuItemMap.get(i.menuItemId)
      return mi && mi.hidden
    })
    .map((i) => i.menuItemId)

  if (hiddenItems.length > 0) {
    return NextResponse.json(
      { error: 'Món này không còn trong thực đơn', hiddenItems },
      { status: 400 },
    )
  }

  // Check for unavailable items
  const unavailableItems = items
    .filter((i) => {
      const mi = menuItemMap.get(i.menuItemId)
      return mi && !mi.available
    })
    .map((i) => i.menuItemId)

  if (unavailableItems.length > 0) {
    return NextResponse.json(
      { error: 'Một số món đã hết hàng', unavailableItems },
      { status: 409 },
    )
  }

  // ─── Compute totalAmount server-side ──────────────────────────────
  const totalAmount = items.reduce((sum, item) => {
    const menuItem = menuItemMap.get(item.menuItemId)!
    return sum + menuItem.price * item.quantity
  }, 0)

  // ─── Create Order + OrderItems in transaction ─────────────────────
  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tableId,
          totalAmount,
          status: 'PENDING',
        },
      })

      await tx.orderItem.createMany({
        data: items.map((i) => ({
          orderId: newOrder.id,
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          status: 'PENDING',
        })),
      })

      // Re-fetch with items + menuItem names + table info for response & broadcast
      return tx.order.findUniqueOrThrow({
        where: { id: newOrder.id },
        include: {
          table: true,
          items: {
            include: {
              menuItem: { select: { id: true, name: true, category: true, price: true } },
            },
          },
        },
      })
    })

    // Broadcast new order to all SSE subscribers (no station filter —
    // both bar and kitchen may have relevant items)
    console.log(`[POST /api/order] Broadcasting new-order event for order #${order.id}`)
    broadcast('new-order', order)

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/order] Transaction failed:', error)
    return NextResponse.json(
      { error: 'Không thể tạo đơn hàng. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}
