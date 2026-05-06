import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * PUT /api/admin/menu/[id]
 *
 * Full update of a menu item. Any combination of fields can be provided.
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
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ.' },
      { status: 400 },
    )
  }

  // Check item exists
  const existing = await prisma.menuItem.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Món không tồn tại' }, { status: 404 })
  }

  // Build update data from provided fields
  const data: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Tên món không được để trống' }, { status: 400 })
    }
    data.name = body.name.trim()
  }

  if (body.price !== undefined) {
    if (typeof body.price !== 'number' || !Number.isInteger(body.price) || body.price <= 0) {
      return NextResponse.json({ error: 'Giá phải lớn hơn 0' }, { status: 400 })
    }
    data.price = body.price
  }

  if (body.category !== undefined) {
    if (body.category !== 'DRINK' && body.category !== 'FOOD') {
      return NextResponse.json({ error: 'Danh mục phải là DRINK hoặc FOOD' }, { status: 400 })
    }
    data.category = body.category
  }

  if (body.description !== undefined) {
    data.description = typeof body.description === 'string' ? body.description.trim() : null
  }

  if (body.sortOrder !== undefined) {
    if (typeof body.sortOrder !== 'number' || !Number.isInteger(body.sortOrder)) {
      return NextResponse.json({ error: 'Thứ tự phải là số nguyên' }, { status: 400 })
    }
    data.sortOrder = body.sortOrder
  }

  if (body.available !== undefined) {
    if (typeof body.available !== 'boolean') {
      return NextResponse.json({ error: 'Trạng thái phải là boolean' }, { status: 400 })
    }
    data.available = body.available
  }

  try {
    const item = await prisma.menuItem.update({ where: { id }, data })
    console.log(`[PUT /api/admin/menu/${id}] Updated menu item: ${item.name}`)
    return NextResponse.json({ item })
  } catch (error) {
    console.error(`[PUT /api/admin/menu/${id}] Failed to update:`, error)
    return NextResponse.json(
      { error: 'Không thể cập nhật món. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/admin/menu/[id]
 *
 * Toggle a boolean field: available or hidden.
 * Body: { field: 'available' | 'hidden', value: boolean }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: idStr } = await context.params
  const id = parseInt(idStr, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ.' },
      { status: 400 },
    )
  }

  const { field, value } = body

  if ((field !== 'available' && field !== 'hidden') || typeof value !== 'boolean') {
    return NextResponse.json(
      { error: 'Field phải là "available" hoặc "hidden", value phải là boolean' },
      { status: 400 },
    )
  }

  const existing = await prisma.menuItem.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Món không tồn tại' }, { status: 404 })
  }

  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data: { [field]: value },
    })
    console.log(`[PATCH /api/admin/menu/${id}] Toggled ${field}=${value} for: ${item.name}`)
    return NextResponse.json({ item })
  } catch (error) {
    console.error(`[PATCH /api/admin/menu/${id}] Failed to toggle:`, error)
    return NextResponse.json(
      { error: 'Không thể cập nhật món. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/admin/menu/[id]
 *
 * Soft-delete: sets hidden=true. Convenience alias for PATCH hidden=true.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idStr } = await context.params
  const id = parseInt(idStr, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
  }

  const existing = await prisma.menuItem.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Món không tồn tại' }, { status: 404 })
  }

  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data: { hidden: true },
    })
    console.log(`[DELETE /api/admin/menu/${id}] Soft-deleted menu item: ${item.name}`)
    return NextResponse.json({ item })
  } catch (error) {
    console.error(`[DELETE /api/admin/menu/${id}] Failed to soft-delete:`, error)
    return NextResponse.json(
      { error: 'Không thể xoá món. Vui lòng thử lại.' },
      { status: 500 },
    )
  }
}
