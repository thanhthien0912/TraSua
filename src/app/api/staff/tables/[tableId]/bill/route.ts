export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/staff/tables/[tableId]/bill
 *
 * Aggregates all unpaid, non-cancelled orders for a table into a single bill.
 * Returns table info, individual orders, a flat item list, and the aggregated total.
 *
 * Response shape:
 *   { table: { id, number, name }, orders: [...], items: [...], total: number }
 *
 * Errors:
 *   400 — invalid tableId
 *   404 — no unpaid orders for this table
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const { tableId: tableIdStr } = await params
  const tableId = parseInt(tableIdStr, 10)

  if (isNaN(tableId)) {
    return NextResponse.json(
      { error: 'ID bàn không hợp lệ.' },
      { status: 400 }
    )
  }

  console.log(`[GET /api/staff/tables/${tableId}/bill] Fetching bill`)

  // ─── Query unpaid, non-cancelled orders ───────────────────────────
  const orders = await prisma.order.findMany({
    where: {
      tableId,
      status: { notIn: ['PAID', 'CANCELLED'] },
    },
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
    orderBy: { createdAt: 'asc' },
  })

  if (orders.length === 0) {
    console.log(
      `[GET /api/staff/tables/${tableId}/bill] No unpaid orders found`
    )
    return NextResponse.json(
      { error: 'Bàn này không có đơn chưa thanh toán.' },
      { status: 404 }
    )
  }

  // ─── Build flat item list and compute total ───────────────────────
  const table = { id: orders[0].table.id, number: orders[0].table.number, name: orders[0].table.name }

  const items = orders.flatMap((order) =>
    order.items.map((item) => ({
      id: item.id,
      orderId: order.id,
      menuItemId: item.menuItem.id,
      name: item.menuItem.name,
      category: item.menuItem.category,
      price: item.menuItem.price,
      quantity: item.quantity,
      status: item.status,
      notes: item.notes,
    }))
  )

  // Total excludes CANCELLED items
  const total = items.reduce((sum, item) => {
    if (item.status === 'CANCELLED') return sum
    return sum + item.price * item.quantity
  }, 0)

  console.log(
    `[GET /api/staff/tables/${tableId}/bill] Found ${orders.length} orders, ${items.length} items, total=${total}`
  )

  return NextResponse.json({ table, orders, items, total })
}
