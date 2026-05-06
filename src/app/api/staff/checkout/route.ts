import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/staff/checkout
 *
 * Returns all tables that have at least one unpaid, non-cancelled order.
 * Each table includes the count of unpaid orders and the aggregated total
 * (excluding CANCELLED items).
 *
 * Response shape:
 *   { tables: [{ id, number, name, orderCount, total }] }
 */
export async function GET() {
  console.log('[GET /api/staff/checkout] Fetching tables with unpaid orders')

  const tables = await prisma.table.findMany({
    where: {
      orders: {
        some: {
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
      },
    },
    include: {
      orders: {
        where: {
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
        include: {
          items: {
            include: {
              menuItem: {
                select: { price: true },
              },
            },
          },
        },
      },
    },
    orderBy: { number: 'asc' },
  })

  const result = tables.map((table) => {
    // Compute total from all non-cancelled items across all unpaid orders
    const total = table.orders.reduce((tableSum, order) => {
      const orderItemsTotal = order.items.reduce((itemSum, item) => {
        if (item.status === 'CANCELLED') return itemSum
        return itemSum + item.menuItem.price * item.quantity
      }, 0)
      return tableSum + orderItemsTotal
    }, 0)

    return {
      id: table.id,
      number: table.number,
      name: table.name,
      orderCount: table.orders.length,
      total,
    }
  })

  console.log(
    `[GET /api/staff/checkout] Found ${result.length} tables with unpaid orders`
  )

  return NextResponse.json({ tables: result })
}
