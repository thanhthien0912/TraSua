export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/tables
 *
 * Returns all tables with their order counts.
 * Admin middleware handles authentication.
 */
export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { number: 'asc' },
      include: {
        _count: {
          select: {
            orders: {
              where: { paidAt: null },
            },
          },
        },
      },
    })

    console.log(`[GET /api/admin/tables] Returning ${tables.length} tables`)

    return NextResponse.json({
      tables: tables.map((t) => ({
        id: t.id,
        number: t.number,
        name: t.name,
        orderCount: t._count?.orders ?? 0,
      })),
    })
  } catch (error) {
    console.error('[GET /api/admin/tables] Failed:', error)
    return NextResponse.json(
      { error: 'Không thể tải danh sách bàn. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/admin/tables
 *
 * Creates a new table with auto-numbered name "Bàn N".
 * Auto-detects the next available number.
 * Required: none (all fields auto-generated).
 */
export async function POST() {
  try {
    // Find the highest existing table number
    const lastTable = await prisma.table.findFirst({
      orderBy: { number: 'desc' },
      select: { number: true },
    })
    const nextNumber = (lastTable?.number ?? 0) + 1
    const name = `Bàn ${nextNumber}`

    const table = await prisma.table.create({
      data: { number: nextNumber, name },
    })

    console.log(`[POST /api/admin/tables] Created table #${table.id}: ${table.name} (number=${table.number})`)

    return NextResponse.json({
      table: {
        id: table.id,
        number: table.number,
        name: table.name,
        orderCount: 0,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/tables] Failed:', error)
    return NextResponse.json(
      { error: 'Không thể tạo bàn mới. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}
