import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Prisma ────────────────────────────────────────────────────
const mockFindMany = vi.fn()
const mockCreate = vi.fn()
const mockFindUnique = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    menuItem: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

// ─── Import route handlers (after mock is set up) ───────────────────
import { GET, POST } from '../route'
import { PUT, PATCH, DELETE } from '../[id]/route'

// ─── Helpers ────────────────────────────────────────────────────────

/** Create a NextRequest with JSON body */
function makeRequest(
  url: string,
  method: string,
  body?: Record<string, unknown>,
): Request {
  const init: RequestInit = {
    method,
    headers: { 'content-type': 'application/json' },
  }
  if (body) init.body = JSON.stringify(body)
  return new Request(url, init)
}

/** Build the context object Next.js passes to dynamic route handlers */
function makeContext(id: string | number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

/** Parse JSON from a NextResponse */
async function json(res: Response) {
  return res.json()
}

// ─── Reset mocks ────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
})

// =====================================================================
// GET /api/admin/menu
// =====================================================================
describe('GET /api/admin/menu', () => {
  it('returns all items including hidden ones', async () => {
    const items = [
      { id: 1, name: 'Trà sữa', hidden: false, available: true },
      { id: 2, name: 'Cà phê', hidden: true, available: true },
    ]
    mockFindMany.mockResolvedValue(items)

    const res = await GET()
    expect(res.status).toBe(200)

    const data = await json(res)
    expect(data.items).toHaveLength(2)
    expect(data.items[1].hidden).toBe(true)

    // Verify findMany was called without hidden filter
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: { sortOrder: 'asc' },
    })
  })

  it('returns 500 on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB connection failed'))

    const res = await GET()
    expect(res.status).toBe(500)

    const data = await json(res)
    expect(data.error).toBeDefined()
  })
})

// =====================================================================
// POST /api/admin/menu
// =====================================================================
describe('POST /api/admin/menu', () => {
  it('creates item with valid data', async () => {
    const newItem = {
      id: 10,
      name: 'Trà đào',
      price: 35000,
      category: 'DRINK',
      description: null,
      sortOrder: 0,
      available: true,
      hidden: false,
    }
    mockCreate.mockResolvedValue(newItem)

    const req = makeRequest('http://localhost/api/admin/menu', 'POST', {
      name: 'Trà đào',
      price: 35000,
      category: 'DRINK',
    })

    const res = await POST(req as any)
    expect(res.status).toBe(201)

    const data = await json(res)
    expect(data.item.name).toBe('Trà đào')
    expect(data.item.price).toBe(35000)

    expect(mockCreate).toHaveBeenCalledOnce()
    const createArg = mockCreate.mock.calls[0][0]
    expect(createArg.data.name).toBe('Trà đào')
    expect(createArg.data.price).toBe(35000)
    expect(createArg.data.category).toBe('DRINK')
  })

  it('returns 400 for missing name', async () => {
    const req = makeRequest('http://localhost/api/admin/menu', 'POST', {
      price: 35000,
      category: 'DRINK',
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)

    const data = await json(res)
    expect(data.error).toContain('Tên món')
  })

  it('returns 400 for empty name', async () => {
    const req = makeRequest('http://localhost/api/admin/menu', 'POST', {
      name: '   ',
      price: 35000,
      category: 'DRINK',
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)

    const data = await json(res)
    expect(data.error).toContain('Tên món')
  })

  it('returns 400 for price <= 0', async () => {
    const req = makeRequest('http://localhost/api/admin/menu', 'POST', {
      name: 'Trà đào',
      price: 0,
      category: 'DRINK',
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)

    const data = await json(res)
    expect(data.error).toContain('Giá')
  })

  it('returns 400 for negative price', async () => {
    const req = makeRequest('http://localhost/api/admin/menu', 'POST', {
      name: 'Trà đào',
      price: -5000,
      category: 'DRINK',
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-integer price', async () => {
    const req = makeRequest('http://localhost/api/admin/menu', 'POST', {
      name: 'Trà đào',
      price: 35.5,
      category: 'DRINK',
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid category', async () => {
    const req = makeRequest('http://localhost/api/admin/menu', 'POST', {
      name: 'Trà đào',
      price: 35000,
      category: 'DESSERT',
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)

    const data = await json(res)
    expect(data.error).toContain('DRINK')
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/admin/menu', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('trims whitespace from name', async () => {
    mockCreate.mockResolvedValue({
      id: 11,
      name: 'Trà đào',
      price: 35000,
      category: 'DRINK',
    })

    const req = makeRequest('http://localhost/api/admin/menu', 'POST', {
      name: '  Trà đào  ',
      price: 35000,
      category: 'DRINK',
    })

    await POST(req as any)

    const createArg = mockCreate.mock.calls[0][0]
    expect(createArg.data.name).toBe('Trà đào')
  })

  it('sets default available=true and sortOrder=0', async () => {
    mockCreate.mockResolvedValue({ id: 12, name: 'Test' })

    const req = makeRequest('http://localhost/api/admin/menu', 'POST', {
      name: 'Test',
      price: 10000,
      category: 'FOOD',
    })

    await POST(req as any)

    const createArg = mockCreate.mock.calls[0][0]
    expect(createArg.data.available).toBe(true)
    expect(createArg.data.sortOrder).toBe(0)
  })

  it('accepts optional description', async () => {
    mockCreate.mockResolvedValue({ id: 13, name: 'Test', description: 'Ngon lắm' })

    const req = makeRequest('http://localhost/api/admin/menu', 'POST', {
      name: 'Test',
      price: 10000,
      category: 'FOOD',
      description: 'Ngon lắm',
    })

    await POST(req as any)

    const createArg = mockCreate.mock.calls[0][0]
    expect(createArg.data.description).toBe('Ngon lắm')
  })
})

// =====================================================================
// PUT /api/admin/menu/[id]
// =====================================================================
describe('PUT /api/admin/menu/[id]', () => {
  it('updates fields for an existing item', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, name: 'Old Name' })
    mockUpdate.mockResolvedValue({
      id: 1,
      name: 'New Name',
      price: 40000,
    })

    const req = makeRequest('http://localhost/api/admin/menu/1', 'PUT', {
      name: 'New Name',
      price: 40000,
    })

    const res = await PUT(req as any, makeContext(1))
    expect(res.status).toBe(200)

    const data = await json(res)
    expect(data.item.name).toBe('New Name')
    expect(data.item.price).toBe(40000)
  })

  it('returns 404 for non-existent ID', async () => {
    mockFindUnique.mockResolvedValue(null)

    const req = makeRequest('http://localhost/api/admin/menu/999', 'PUT', {
      name: 'New Name',
    })

    const res = await PUT(req as any, makeContext(999))
    expect(res.status).toBe(404)

    const data = await json(res)
    expect(data.error).toContain('không tồn tại')
  })

  it('returns 400 for invalid ID (NaN)', async () => {
    const req = makeRequest('http://localhost/api/admin/menu/abc', 'PUT', {
      name: 'New Name',
    })

    const res = await PUT(req as any, makeContext('abc'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty name', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, name: 'Existing' })

    const req = makeRequest('http://localhost/api/admin/menu/1', 'PUT', {
      name: '',
    })

    const res = await PUT(req as any, makeContext(1))
    expect(res.status).toBe(400)
  })

  it('returns 400 for price <= 0', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, name: 'Existing' })

    const req = makeRequest('http://localhost/api/admin/menu/1', 'PUT', {
      price: 0,
    })

    const res = await PUT(req as any, makeContext(1))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid category', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, name: 'Existing' })

    const req = makeRequest('http://localhost/api/admin/menu/1', 'PUT', {
      category: 'INVALID',
    })

    const res = await PUT(req as any, makeContext(1))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/admin/menu/1', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    })

    const res = await PUT(req as any, makeContext(1))
    expect(res.status).toBe(400)
  })

  it('validates sortOrder is an integer', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, name: 'Existing' })

    const req = makeRequest('http://localhost/api/admin/menu/1', 'PUT', {
      sortOrder: 2.5,
    })

    const res = await PUT(req as any, makeContext(1))
    expect(res.status).toBe(400)
  })

  it('validates available is boolean', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, name: 'Existing' })

    const req = makeRequest('http://localhost/api/admin/menu/1', 'PUT', {
      available: 'yes',
    })

    const res = await PUT(req as any, makeContext(1))
    expect(res.status).toBe(400)
  })
})

// =====================================================================
// PATCH /api/admin/menu/[id]
// =====================================================================
describe('PATCH /api/admin/menu/[id]', () => {
  it('toggles available flag', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, name: 'Trà sữa', available: true })
    mockUpdate.mockResolvedValue({ id: 1, name: 'Trà sữa', available: false })

    const req = makeRequest('http://localhost/api/admin/menu/1', 'PATCH', {
      field: 'available',
      value: false,
    })

    const res = await PATCH(req as any, makeContext(1))
    expect(res.status).toBe(200)

    const data = await json(res)
    expect(data.item.available).toBe(false)

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { available: false },
    })
  })

  it('toggles hidden flag', async () => {
    mockFindUnique.mockResolvedValue({ id: 2, name: 'Cà phê', hidden: false })
    mockUpdate.mockResolvedValue({ id: 2, name: 'Cà phê', hidden: true })

    const req = makeRequest('http://localhost/api/admin/menu/2', 'PATCH', {
      field: 'hidden',
      value: true,
    })

    const res = await PATCH(req as any, makeContext(2))
    expect(res.status).toBe(200)

    const data = await json(res)
    expect(data.item.hidden).toBe(true)

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { hidden: true },
    })
  })

  it('returns 404 for non-existent ID', async () => {
    mockFindUnique.mockResolvedValue(null)

    const req = makeRequest('http://localhost/api/admin/menu/999', 'PATCH', {
      field: 'available',
      value: false,
    })

    const res = await PATCH(req as any, makeContext(999))
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid field name', async () => {
    const req = makeRequest('http://localhost/api/admin/menu/1', 'PATCH', {
      field: 'price',
      value: true,
    })

    const res = await PATCH(req as any, makeContext(1))
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-boolean value', async () => {
    const req = makeRequest('http://localhost/api/admin/menu/1', 'PATCH', {
      field: 'available',
      value: 'yes',
    })

    const res = await PATCH(req as any, makeContext(1))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid ID', async () => {
    const req = makeRequest('http://localhost/api/admin/menu/abc', 'PATCH', {
      field: 'available',
      value: true,
    })

    const res = await PATCH(req as any, makeContext('abc'))
    expect(res.status).toBe(400)
  })
})

// =====================================================================
// DELETE /api/admin/menu/[id]
// =====================================================================
describe('DELETE /api/admin/menu/[id]', () => {
  it('soft-deletes by setting hidden=true', async () => {
    mockFindUnique.mockResolvedValue({ id: 3, name: 'Nước ép', hidden: false })
    mockUpdate.mockResolvedValue({ id: 3, name: 'Nước ép', hidden: true })

    const req = makeRequest('http://localhost/api/admin/menu/3', 'DELETE')

    const res = await DELETE(req as any, makeContext(3))
    expect(res.status).toBe(200)

    const data = await json(res)
    expect(data.item.hidden).toBe(true)

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { hidden: true },
    })
  })

  it('returns 404 for non-existent ID', async () => {
    mockFindUnique.mockResolvedValue(null)

    const req = makeRequest('http://localhost/api/admin/menu/999', 'DELETE')

    const res = await DELETE(req as any, makeContext(999))
    expect(res.status).toBe(404)

    const data = await json(res)
    expect(data.error).toContain('không tồn tại')
  })

  it('returns 400 for invalid ID', async () => {
    const req = makeRequest('http://localhost/api/admin/menu/abc', 'DELETE')

    const res = await DELETE(req as any, makeContext('abc'))
    expect(res.status).toBe(400)
  })
})
