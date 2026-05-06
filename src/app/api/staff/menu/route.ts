import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/staff/menu
 *
 * Returns all menu items sorted by sortOrder ascending.
 * Used by the add-item modal to display available menu items.
 *
 * Returns: { items: MenuItem[] }
 */
export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { hidden: false },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        available: true,
        sortOrder: true,
      },
    })

    console.log(
      `[GET /api/staff/menu] Returning ${menuItems.length} menu items`
    )

    return NextResponse.json({ items: menuItems })
  } catch (error) {
    console.error('[GET /api/staff/menu] Failed to fetch menu items:', error)
    return NextResponse.json(
      { error: 'Không thể tải danh sách món. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
