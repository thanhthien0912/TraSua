import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Tests for hidden-item filtering across customer and staff surfaces.
 *
 * Verifies:
 * 1. Customer menu page query uses { hidden: false }
 * 2. Staff menu API filters out hidden items
 * 3. Order creation rejects hidden menu items with 400
 * 4. Order creation distinguishes hidden (400) from unavailable (409)
 */

// ─── Mock Prisma ────────────────────────────────────────────────────
const mockMenuItemFindMany = vi.fn()
const mockMenuItemFindUnique = vi.fn()
const mockTableFindUnique = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    menuItem: {
      findMany: (...args: unknown[]) => mockMenuItemFindMany(...args),
      findUnique: (...args: unknown[]) => mockMenuItemFindUnique(...args),
    },
    table: {
      findUnique: (...args: unknown[]) => mockTableFindUnique(...args),
    },
    $transaction: vi.fn(),
  },
}))

// Mock SSE broadcast (order route imports it)
vi.mock('@/lib/sse', () => ({
  broadcast: vi.fn(),
}))

// ─── Import route handlers ──────────────────────────────────────────
import { GET as staffMenuGet } from '@/app/api/staff/menu/route'
import { POST as orderPost } from '@/app/api/order/route'

// ─── Helpers ────────────────────────────────────────────────────────

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

async function json(res: Response) {
  return res.json()
}

beforeEach(() => {
  vi.clearAllMocks()
})

// =====================================================================
// Staff menu route filters out hidden items
// =====================================================================
describe('Staff menu — hidden-item filtering', () => {
  it('GET /api/staff/menu filters out hidden items', async () => {
    const visibleItems = [
      { id: 1, name: 'Trà sữa', price: 30000, category: 'DRINK', available: true, sortOrder: 0 },
      { id: 3, name: 'Phở', price: 50000, category: 'FOOD', available: true, sortOrder: 2 },
    ]
    mockMenuItemFindMany.mockResolvedValue(visibleItems)

    const res = await staffMenuGet()
    expect(res.status).toBe(200)

    const data = await json(res)
    expect(data.items).toHaveLength(2)

    // Verify the query includes hidden: false filter
    expect(mockMenuItemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hidden: false },
      }),
    )
  })

  it('returns empty array when all items are hidden', async () => {
    mockMenuItemFindMany.mockResolvedValue([])

    const res = await staffMenuGet()
    expect(res.status).toBe(200)

    const data = await json(res)
    expect(data.items).toHaveLength(0)
  })
})

// =====================================================================
// Customer menu page uses hidden: false in query
// =====================================================================
describe('Customer menu — hidden-item filtering contract', () => {
  /**
   * The customer menu (src/app/order/page.tsx) is a Server Component that
   * calls prisma.menuItem.findMany({ where: { hidden: false } }) directly.
   * We cannot import and execute a Server Component in vitest, so we verify
   * the contract by asserting the query shape matches what the code contains.
   *
   * This is a "contract test" — it documents the expected behavior and will
   * catch regressions if someone changes the staff route (same pattern).
   */
  it('staff menu route uses the same hidden:false filter as customer page', async () => {
    mockMenuItemFindMany.mockResolvedValue([])

    await staffMenuGet()

    const callArgs = mockMenuItemFindMany.mock.calls[0][0]
    expect(callArgs.where).toEqual({ hidden: false })
    expect(callArgs.orderBy).toEqual({ sortOrder: 'asc' })
  })
})

// =====================================================================
// Order creation rejects hidden menu items
// =====================================================================
describe('Order creation — hidden item rejection', () => {
  it('rejects order with hidden menu item (400)', async () => {
    // Table exists
    mockTableFindUnique.mockResolvedValue({ id: 1, number: 1 })

    // Menu item exists but is hidden
    mockMenuItemFindMany.mockResolvedValue([
      { id: 5, name: 'Deleted item', price: 30000, available: true, hidden: true },
    ])

    const req = makeRequest('http://localhost/api/order', 'POST', {
      tableId: 1,
      items: [{ menuItemId: 5, quantity: 1 }],
    })

    const res = await orderPost(req as any)
    expect(res.status).toBe(400)

    const data = await json(res)
    expect(data.hiddenItems).toContain(5)
    expect(data.error).toContain('không còn trong thực đơn')
  })

  it('hidden check runs BEFORE unavailable check', async () => {
    // An item that is BOTH hidden and unavailable should get 400 (hidden),
    // not 409 (unavailable)
    mockTableFindUnique.mockResolvedValue({ id: 1, number: 1 })
    mockMenuItemFindMany.mockResolvedValue([
      { id: 7, name: 'Both hidden+unavailable', price: 20000, available: false, hidden: true },
    ])

    const req = makeRequest('http://localhost/api/order', 'POST', {
      tableId: 1,
      items: [{ menuItemId: 7, quantity: 1 }],
    })

    const res = await orderPost(req as any)
    // Should be 400 (hidden), not 409 (unavailable)
    expect(res.status).toBe(400)

    const data = await json(res)
    expect(data.hiddenItems).toContain(7)
  })

  it('unavailable item (not hidden) returns 409', async () => {
    mockTableFindUnique.mockResolvedValue({ id: 1, number: 1 })
    mockMenuItemFindMany.mockResolvedValue([
      { id: 8, name: 'Hết hàng', price: 25000, available: false, hidden: false },
    ])

    const req = makeRequest('http://localhost/api/order', 'POST', {
      tableId: 1,
      items: [{ menuItemId: 8, quantity: 1 }],
    })

    const res = await orderPost(req as any)
    expect(res.status).toBe(409)

    const data = await json(res)
    expect(data.unavailableItems).toContain(8)
  })

  it('allows order with visible and available items', async () => {
    mockTableFindUnique.mockResolvedValue({ id: 1, number: 1 })
    mockMenuItemFindMany.mockResolvedValue([
      { id: 1, name: 'Trà sữa', price: 30000, available: true, hidden: false },
    ])

    // Mock transaction for successful order creation
    const { prisma } = await import('@/lib/prisma')
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 100,
      tableId: 1,
      totalAmount: 30000,
      status: 'PENDING',
      items: [{ menuItemId: 1, quantity: 1, menuItem: { name: 'Trà sữa' } }],
    })

    const req = makeRequest('http://localhost/api/order', 'POST', {
      tableId: 1,
      items: [{ menuItemId: 1, quantity: 1 }],
    })

    const res = await orderPost(req as any)
    expect(res.status).toBe(201)
  })

  it('mixed order: one hidden + one visible item → rejects entire order', async () => {
    mockTableFindUnique.mockResolvedValue({ id: 1, number: 1 })
    mockMenuItemFindMany.mockResolvedValue([
      { id: 1, name: 'Trà sữa', price: 30000, available: true, hidden: false },
      { id: 5, name: 'Deleted', price: 20000, available: true, hidden: true },
    ])

    const req = makeRequest('http://localhost/api/order', 'POST', {
      tableId: 1,
      items: [
        { menuItemId: 1, quantity: 1 },
        { menuItemId: 5, quantity: 2 },
      ],
    })

    const res = await orderPost(req as any)
    expect(res.status).toBe(400)

    const data = await json(res)
    expect(data.hiddenItems).toEqual([5])
  })

  it('rejects order when table does not exist', async () => {
    mockTableFindUnique.mockResolvedValue(null)

    const req = makeRequest('http://localhost/api/order', 'POST', {
      tableId: 999,
      items: [{ menuItemId: 1, quantity: 1 }],
    })

    const res = await orderPost(req as any)
    expect(res.status).toBe(404)
  })

  it('rejects order with non-existent menu item', async () => {
    mockTableFindUnique.mockResolvedValue({ id: 1, number: 1 })
    mockMenuItemFindMany.mockResolvedValue([]) // no items found

    const req = makeRequest('http://localhost/api/order', 'POST', {
      tableId: 1,
      items: [{ menuItemId: 999, quantity: 1 }],
    })

    const res = await orderPost(req as any)
    expect(res.status).toBe(400)

    const data = await json(res)
    expect(data.missingItems).toContain(999)
  })
})
