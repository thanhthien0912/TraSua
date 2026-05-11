export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/admin/tables/[id]
 *
 * Returns a single table by ID with order count.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: idStr } = await context.params
  const id = parseInt(idStr, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
  }

  try {
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: { where: { paidAt: null } },
          },
        },
      },
    })

    if (!table) {
      return NextResponse.json({ error: 'Bàn không tồn tại' }, { status: 404 })
    }

    return NextResponse.json({
      table: {
        id: table.id,
        number: table.number,
        name: table.name,
        orderCount: table._count?.orders ?? 0,
      },
    })
  } catch (error) {
    console.error(`[GET /api/admin/tables/${id}] Failed:`, error)
    return NextResponse.json(
      { error: 'Không thể tải thông tin bàn. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/admin/tables/[id]
 *
 * Full update: rename a table.
 * Body: { name: string }
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: idStr } = await context.params
  const id = parseInt(idStr, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
  }

  const existing = await prisma.table.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Bàn không tồn tại' }, { status: 404 })
  }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ error: 'Tên bàn không được để trống' }, { status: 400 })
  }

  const trimmed = body.name.trim()
  if (trimmed.length > 50) {
    return NextResponse.json({ error: 'Tên bàn không được dài quá 50 ký tự' }, { status: 400 })
  }

  try {
    const table = await prisma.table.update({
      where: { id },
      data: { name: body.name.trim() },
    })

    console.log(`[PUT /api/admin/tables/${id}] Renamed to: ${table.name}`)

    const orderCount = await prisma.order.count({
      where: { tableId: id, paidAt: null },
    })

    return NextResponse.json({
      table: { id: table.id, number: table.number, name: table.name, orderCount },
    })
  } catch (error) {
    console.error(`[PUT /api/admin/tables/${id}] Failed:`, error)
    return NextResponse.json(
      { error: 'Không thể cập nhật bàn. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/admin/tables/[id]
 *
 * Deletes a table only if it has no unpaid orders.
 * Returns 409 with { hasUnpaidOrders: true } if orders exist.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idStr } = await context.params
  const id = parseInt(idStr, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
  }

  const existing = await prisma.table.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Bàn không tồn tại' }, { status: 404 })
  }

  // Guard: check for unpaid orders
  const unpaidCount = await prisma.order.count({
    where: { tableId: id, paidAt: null },
  })

  if (unpaidCount > 0) {
    console.log(`[DELETE /api/admin/tables/${id}] Blocked — ${unpaidCount} unpaid orders exist`)
    return NextResponse.json(
      {
        error: `Bàn đang có ${unpaidCount} đơn chưa thanh toán. Không thể xoá.`,
        hasUnpaidOrders: true,
      },
      { status: 409 },
    )
  }

  try {
    await prisma.table.delete({ where: { id } })
    console.log(`[DELETE /api/admin/tables/${id}] Deleted table: ${existing.name}`)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(`[DELETE /api/admin/tables/${id}] Failed:`, error)
    return NextResponse.json(
      { error: 'Không thể xoá bàn. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}
