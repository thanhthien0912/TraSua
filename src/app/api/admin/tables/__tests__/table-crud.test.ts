import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Prisma ────────────────────────────────────────────────────
const mockFindMany = vi.fn()
const mockFindFirst = vi.fn()
const mockCreate = vi.fn()
const mockFindUnique = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockCount = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    table: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    order: {
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}))

// ─── Import route handlers ───────────────────────────────────────────
import { GET, POST } from '../route'
import { GET as GET_ONE, PUT, DELETE } from '../[id]/route'

// ─── Helpers ────────────────────────────────────────────────────────

function makeRequest(url: string, method: string, body?: Record<string, unknown>): Request {
  const init: RequestInit = { method, headers: { 'content-type': 'application/json' } }
  if (body) init.body = JSON.stringify(body)
  return new Request(url, init)
}

function makeContext(id: string | number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

async function json(res: Response) {
  return res.json()
}

// ─── Reset mocks ────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
})

// =====================================================================
// GET /api/admin/tables
// =====================================================================
describe('GET /api/admin/tables', () => {
  it('returns empty list when no tables exist', async () => {
    mockFindMany.mockResolvedValue([])

    const res = await GET()
    expect(res.status).toBe(200)

    const data = await json(res)
    expect(data.tables).toHaveLength(0)
  })

  it('returns tables ordered by number with orderCount', async () => {
    mockFindMany.mockResolvedValue([
      { id: 1, number: 1, name: 'Bàn 1', _count: { orders: 2 } },
      { id: 2, number: 2, name: 'Bàn 2', _count: { orders: 0 } },
    ])

    const res = await GET()
    expect(res.status).toBe(200)

    const data = await json(res)
    expect(data.tables).toHaveLength(2)
    expect(data.tables[0]).toEqual({ id: 1, number: 1, name: 'Bàn 1', orderCount: 2 })
    expect(data.tables[1]).toEqual({ id: 2, number: 2, name: 'Bàn 2', orderCount: 0 })
  })

  it('returns 500 on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const res = await GET()
    expect(res.status).toBe(500)
  })
})

// =====================================================================
// POST /api/admin/tables
// =====================================================================
describe('POST /api/admin/tables', () => {
  it('creates first table with number=1, name="Bàn 1"', async () => {
    mockFindFirst.mockResolvedValue(null) // no existing tables
    mockCreate.mockResolvedValue({ id: 1, number: 1, name: 'Bàn 1' })

    const req = makeRequest('http://localhost/api/admin/tables', 'POST')
    const res = await POST(req as any)
    expect(res.status).toBe(201)

    const data = await json(res)
    expect(data.table.id).toBe(1)
    expect(data.table.number).toBe(1)
    expect(data.table.name).toBe('Bàn 1')
    expect(data.table.orderCount).toBe(0)
  })

  it('auto-numbers to max+1', async () => {
    mockFindFirst.mockResolvedValue({ number: 5 })
    mockCreate.mockResolvedValue({ id: 3, number: 6, name: 'Bàn 6' })

    const req = makeRequest('http://localhost/api/admin/tables', 'POST')
    const res = await POST(req as any)
    expect(res.status).toBe(201)

    const data = await json(res)
    expect(data.table.number).toBe(6)
    expect(data.table.name).toBe('Bàn 6')
  })

  it('returns 500 on database error', async () => {
    mockFindFirst.mockRejectedValue(new Error('DB error'))

    const req = makeRequest('http://localhost/api/admin/tables', 'POST')
    const res = await POST(req as any)
    expect(res.status).toBe(500)
  })
})

// =====================================================================
// GET /api/admin/tables/[id]
// =====================================================================
describe('GET /api/admin/tables/[id]', () => {
  it('returns single table with orderCount', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      number: 1,
      name: 'Bàn 1',
      _count: { orders: 3 },
    })

    const req = makeRequest('http://localhost/api/admin/tables/1', 'GET')
    const res = await GET_ONE(req as any, makeContext(1))
    expect(res.status).toBe(200)

    const data = await json(res)
    expect(data).toEqual({ table: { id: 1, number: 1, name: 'Bàn 1', orderCount: 3 } })
  })

  it('returns 404 for non-existent table', async () => {
    mockFindUnique.mockResolvedValue(null)

    const req = makeRequest('http://localhost/api/admin/tables/999', 'GET')
    const res = await GET_ONE(req as any, makeContext(999))
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid ID (NaN)', async () => {
    const req = makeRequest('http://localhost/api/admin/tables/abc', 'GET')
    const res = await GET_ONE(req as any, makeContext('abc'))
    expect(res.status).toBe(400)
  })
})

// =====================================================================
// PUT /api/admin/tables/[id]
// =====================================================================
describe('PUT /api/admin/tables/[id]', () => {
  it('renames table with valid name', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, number: 1, name: 'Bàn 1', orders: [] })
    mockUpdate.mockResolvedValue({ id: 1, number: 1, name: 'Bàn VIP' })

    const req = makeRequest('http://localhost/api/admin/tables/1', 'PUT', { name: 'Bàn VIP' })
    const res = await PUT(req as any, makeContext(1))
    expect(res.status).toBe(200)

    const data = await json(res)
    expect(data.table.name).toBe('Bàn VIP')
  })

  it('trims whitespace from name', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, number: 1, name: 'Bàn 1', orders: [] })
    mockUpdate.mockResolvedValue({ id: 1, number: 1, name: 'Bàn sân vườn' })

    const req = makeRequest('http://localhost/api/admin/tables/1', 'PUT', { name: '  Bàn sân vườn  ' })
    await PUT(req as any, makeContext(1))

    const updateArg = mockUpdate.mock.calls[0][0]
    expect(updateArg.data.name).toBe('Bàn sân vườn')
  })

  it('returns 400 for empty name', async () => {
    const req = makeRequest('http://localhost/api/admin/tables/1', 'PUT', { name: '' })
    const res = await PUT(req as any, makeContext(1))
    expect(res.status).toBe(400)
  })

  it('returns 400 for whitespace-only name', async () => {
    const req = makeRequest('http://localhost/api/admin/tables/1', 'PUT', { name: '   ' })
    const res = await PUT(req as any, makeContext(1))
    expect(res.status).toBe(400)
  })

  it('returns 400 for name longer than 50 characters', async () => {
    const req = makeRequest('http://localhost/api/admin/tables/1', 'PUT', {
      name: 'B'.repeat(51),
    })
    const res = await PUT(req as any, makeContext(1))
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent table', async () => {
    mockFindUnique.mockResolvedValue(null)

    const req = makeRequest('http://localhost/api/admin/tables/999', 'PUT', { name: 'New Name' })
    const res = await PUT(req as any, makeContext(999))
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid ID', async () => {
    const req = makeRequest('http://localhost/api/admin/tables/abc', 'PUT', { name: 'New' })
    const res = await PUT(req as any, makeContext('abc'))
    expect(res.status).toBe(400)
  })
})

// =====================================================================
// DELETE /api/admin/tables/[id]
// =====================================================================
describe('DELETE /api/admin/tables/[id]', () => {
  it('deletes table when no unpaid orders exist', async () => {
    mockFindUnique.mockResolvedValue({ id: 2, number: 2, name: 'Bàn 2' })
    mockCount.mockResolvedValue(0) // no unpaid orders
    mockDelete.mockResolvedValue({ id: 2, number: 2, name: 'Bàn 2' })

    const req = makeRequest('http://localhost/api/admin/tables/2', 'DELETE')
    const res = await DELETE(req as any, makeContext(2))
    expect(res.status).toBe(204)
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 2 } })
  })

  it('returns 409 when unpaid orders exist (guard triggered)', async () => {
    mockFindUnique.mockResolvedValue({ id: 3, number: 3, name: 'Bàn 3' })
    mockCount.mockResolvedValue(2) // 2 unpaid orders

    const req = makeRequest('http://localhost/api/admin/tables/3', 'DELETE')
    const res = await DELETE(req as any, makeContext(3))
    expect(res.status).toBe(409)

    const data = await json(res)
    expect(data.error).toContain('chưa thanh toán')
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns 409 when table has PAID orders only (no unpaid) → should succeed', async () => {
    // PAID orders are excluded from the unpaid check, so delete should succeed
    mockFindUnique.mockResolvedValue({ id: 4, number: 4, name: 'Bàn 4' })
    mockCount.mockResolvedValue(0) // no unpaid orders found
    mockDelete.mockResolvedValue({ id: 4, number: 4, name: 'Bàn 4' })

    const req = makeRequest('http://localhost/api/admin/tables/4', 'DELETE')
    const res = await DELETE(req as any, makeContext(4))
    expect(res.status).toBe(204)
  })

  it('returns 404 for non-existent table', async () => {
    mockFindUnique.mockResolvedValue(null)

    const req = makeRequest('http://localhost/api/admin/tables/999', 'DELETE')
    const res = await DELETE(req as any, makeContext(999))
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid ID', async () => {
    const req = makeRequest('http://localhost/api/admin/tables/abc', 'DELETE')
    const res = await DELETE(req as any, makeContext('abc'))
    expect(res.status).toBe(400)
  })
})

// ─── Import prisma mock for the guard test ───────────────────────────
import { prisma } from '@/lib/prisma'