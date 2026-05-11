import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Prisma ────────────────────────────────────────────────────
const mockFindMany = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    table: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}))

// ─── Mock pdfkit + qrcode (avoid actual PDF generation) ──────────────
vi.mock('pdfkit', () => {
  // Class defined inside factory so vitest can hoist vi.mock
  class MockPDFDocument {
    registerFont = vi.fn()
    font = vi.fn().mockReturnThis()
    fontSize = vi.fn().mockReturnThis()
    fillColor = vi.fn().mockReturnThis()
    text = vi.fn().mockReturnThis()
    image = vi.fn().mockReturnThis()
    addPage = vi.fn().mockReturnThis()
    end = vi.fn()
    on = vi.fn((event: string, cb: (chunk?: Buffer) => void) => {
      if (event === 'end') setTimeout(() => cb(), 0)
      if (event === 'data') {
        // no-op: we check mock calls instead of the actual buffer
      }
    })
  }
  return { default: MockPDFDocument }
})

vi.mock('qrcode', () => ({
  default: {
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('fake-qr')),
  },
}))

// ─── Import route handler ─────────────────────────────────────────────
import { GET } from '../route'

// ─── Helpers ─────────────────────────────────────────────────────────
function makeRequest(url: string): any {
  return new Request(url, { method: 'GET' }) as any
}

async function json(res: Response) {
  return res.json()
}

// ─── Reset mocks ────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
})

// =====================================================================
// GET /api/admin/qr-pdf
// =====================================================================
describe('GET /api/admin/qr-pdf', () => {
  it('returns 400 when SHOP_IP env var is missing', async () => {
    const req = makeRequest('http://localhost/api/admin/qr-pdf')
    vi.stubEnv('SHOP_IP', '')
    const res = await GET(req)
    expect(res.status).toBe(400)
    vi.stubEnv('SHOP_IP', '192.168.1.100')
  })

  it('returns 400 when no tables exist in DB', async () => {
    const req = makeRequest('http://localhost/api/admin/qr-pdf')
    vi.stubEnv('SHOP_IP', '192.168.1.100')
    mockFindMany.mockResolvedValue([])

    const res = await GET(req)
    expect(res.status).toBe(400)

    const data = await json(res)
    expect(data.error).toContain('Chưa có bàn nào')
  })

  it('returns PDF buffer when tables exist', async () => {
    const req = makeRequest('http://localhost/api/admin/qr-pdf')
    vi.stubEnv('SHOP_IP', '192.168.1.100')
    vi.stubEnv('SHOP_PORT', '3000')
    mockFindMany.mockResolvedValue([
      { id: 1, number: 1, name: 'Bàn 1' },
      { id: 2, number: 2, name: 'Bàn 2' },
    ])

    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toContain('trasua-qr-codes.pdf')
  })

  it('queries tables from DB ordered by number', async () => {
    const req = makeRequest('http://localhost/api/admin/qr-pdf')
    vi.stubEnv('SHOP_IP', '192.168.1.100')
    mockFindMany.mockResolvedValue([{ id: 1, number: 1, name: 'Bàn 1' }])

    await GET(req)

    expect(mockFindMany).toHaveBeenCalledOnce()
    const callArg = mockFindMany.mock.calls[0][0]
    expect(callArg.orderBy).toEqual({ number: 'asc' })
  })
})
