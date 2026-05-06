import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { broadcast } from '@/lib/sse'

/**
 * POST /api/staff/tables/[tableId]/pay
 *
 * Marks all unpaid, non-cancelled orders for a table as PAID.
 * Sets paidAt timestamp on each order. Broadcasts 'order-paid' SSE event.
 *
 * Response: { paid: true, orderIds: number[], paidAt: string }
 *
 * Errors:
 *   400 — invalid tableId
 *   404 — no unpaid orders for this table
 */
export async function POST(
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

  console.log(`[POST /api/staff/tables/${tableId}/pay] Processing payment`)

  // ─── Find unpaid orders ───────────────────────────────────────────
  const unpaidOrders = await prisma.order.findMany({
    where: {
      tableId,
      status: { notIn: ['PAID', 'CANCELLED'] },
    },
    select: { id: true },
  })

  if (unpaidOrders.length === 0) {
    console.log(
      `[POST /api/staff/tables/${tableId}/pay] No unpaid orders found`
    )
    return NextResponse.json(
      { error: 'Bàn này không có đơn chưa thanh toán.' },
      { status: 404 }
    )
  }

  const orderIds = unpaidOrders.map((o) => o.id)
  const paidAt = new Date()

  // ─── Mark all as PAID in a single transaction ─────────────────────
  try {
    await prisma.$transaction(
      orderIds.map((id) =>
        prisma.order.update({
          where: { id },
          data: { status: 'PAID', paidAt },
        })
      )
    )

    console.log(
      `[POST /api/staff/tables/${tableId}/pay] Marked ${orderIds.length} orders as PAID: [${orderIds.join(', ')}], paidAt=${paidAt.toISOString()}`
    )

    // ─── Broadcast SSE event ──────────────────────────────────────────
    broadcast('order-paid', { tableId, orderIds, paidAt: paidAt.toISOString() })

    return NextResponse.json({
      paid: true,
      orderIds,
      paidAt: paidAt.toISOString(),
    })
  } catch (error) {
    console.error(
      `[POST /api/staff/tables/${tableId}/pay] Transaction failed:`,
      error
    )
    return NextResponse.json(
      { error: 'Không thể xử lý thanh toán. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
