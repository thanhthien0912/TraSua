export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/menu
 *
 * Returns ALL menu items (including hidden), ordered by sortOrder.
 * Admin middleware handles authentication.
 */
export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    console.log(`[GET /api/admin/menu] Returning ${items.length} menu items (including hidden)`)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('[GET /api/admin/menu] Failed to fetch menu items:', error)
    return NextResponse.json(
      { error: 'Không thể tải danh sách món. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/admin/menu
 *
 * Creates a new menu item.
 * Required: name (string), price (int > 0), category (DRINK | FOOD).
 * Optional: description (string), sortOrder (int), available (boolean).
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ.' },
      { status: 400 },
    )
  }

  const { name, price, category, description, sortOrder, available } = body

  // --- Validate required fields ---
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json(
      { error: 'Tên món không được để trống' },
      { status: 400 },
    )
  }

  if (typeof price !== 'number' || !Number.isInteger(price) || price <= 0) {
    return NextResponse.json(
      { error: 'Giá phải lớn hơn 0' },
      { status: 400 },
    )
  }

  if (category !== 'DRINK' && category !== 'FOOD') {
    return NextResponse.json(
      { error: 'Danh mục phải là DRINK hoặc FOOD' },
      { status: 400 },
    )
  }

  try {
    const item = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        price,
        category,
        description: typeof description === 'string' ? description.trim() : null,
        sortOrder: typeof sortOrder === 'number' && Number.isInteger(sortOrder) ? sortOrder : 0,
        available: typeof available === 'boolean' ? available : true,
      },
    })

    console.log(`[POST /api/admin/menu] Created menu item #${item.id}: ${item.name}`)

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/menu] Failed to create menu item:', error)
    return NextResponse.json(
      { error: 'Không thể tạo món mới. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}
