export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deriveOrderStatus } from '@/lib/order-status'

/**
 * GET /api/staff/orders?station=bar|kitchen|all
 *
 * Returns active orders (not SERVED/CANCELLED at order level) with items
 * filtered by station:
 *   - bar:     only items where menuItem.category = DRINK
 *   - kitchen: only items where menuItem.category = FOOD
 *   - all:     all items (default)
 *
 * Each order includes its table info, filtered items with menuItem details,
 * and a derived status computed from item statuses.
 */
export async function GET(request: NextRequest) {
  const station = request.nextUrl.searchParams.get('station') ?? 'all'

  console.log(`[GET /api/staff/orders] Fetching orders (station=${station})`)

  try {
    // Determine category filter based on station
    const categoryFilter =
      station === 'bar'
        ? ('DRINK' as const)
        : station === 'kitchen'
          ? ('FOOD' as const)
          : null

    // Fetch orders that are not SERVED or CANCELLED at order level
    const orders = await prisma.order.findMany({
      where: {
        status: {
          notIn: ['SERVED', 'CANCELLED', 'PAID'],
        },
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                category: true,
                price: true,
              },
            },
          },
          // Apply category filter on the items relation if station is specified
          ...(categoryFilter
            ? {
                where: {
                  menuItem: {
                    category: categoryFilter,
                  },
                },
              }
            : {}),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Filter out orders that have no items after station filtering
    // (e.g. a food-only order should not appear on bar station)
    const filteredOrders = orders.filter((order) => order.items.length > 0)

    // Derive order status from item statuses for accurate display
    const enrichedOrders = filteredOrders.map((order) => ({
      ...order,
      derivedStatus: deriveOrderStatus(order.items.map((item) => item.status)),
    }))

    console.log(
      `[GET /api/staff/orders] Returning ${enrichedOrders.length} orders (station=${station})`
    )

    return NextResponse.json(enrichedOrders)
  } catch (error) {
    console.error('[GET /api/staff/orders] Failed:', error)
    return NextResponse.json(
      { error: 'Không thể tải danh sách đơn hàng.' },
      { status: 500 },
    )
  }
}
