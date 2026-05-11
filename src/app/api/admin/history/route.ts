import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Lấy tất cả bàn
    const tables = await prisma.table.findMany({
      orderBy: { number: 'asc' },
      include: {
        orders: {
          where: { status: 'PAID' },
          include: {
            items: {
              include: { menuItem: true }
            }
          },
          orderBy: { paidAt: 'desc' }
        }
      }
    })

    const result = tables.map(t => {
      const tableTotal = t.orders.reduce((sum, o) => sum + o.totalAmount, 0)
      return {
        id: t.id,
        name: t.name,
        totalRevenue: tableTotal,
        orderCount: t.orders.length,
        orders: t.orders.map(o => ({
          id: o.id,
          total: o.totalAmount,
          paidAt: o.paidAt,
          items: o.items.map(i => `${i.quantity}x ${i.menuItem.name}`)
        }))
      }
    })

    const grandTotal = result.reduce((sum, t) => sum + t.totalRevenue, 0)

    return NextResponse.json({
      tables: result,
      totalRevenue: grandTotal
    })
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi tải dữ liệu' }, { status: 500 })
  }
}
