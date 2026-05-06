import { prisma } from '@/lib/prisma'
import ErrorPage from '@/components/order/ErrorPage'

const INVALID_TABLE_MSG =
  'Bàn không hợp lệ. Vui lòng scan lại mã QR tại bàn của bạn.'

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { table } = await searchParams

  // --- Table validation ---
  const tableStr = typeof table === 'string' ? table : undefined
  const tableNum = tableStr ? parseInt(tableStr, 10) : NaN

  if (!tableStr || isNaN(tableNum)) {
    return <ErrorPage message={INVALID_TABLE_MSG} />
  }

  const tableRecord = await prisma.table.findFirst({
    where: { number: tableNum },
  })

  if (!tableRecord) {
    return <ErrorPage message={INVALID_TABLE_MSG} />
  }

  // --- Fetch all menu items sorted by sortOrder ---
  const menuItems = await prisma.menuItem.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  // Serialize to plain objects for client component boundary
  const items = menuItems.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category as 'DRINK' | 'FOOD',
    price: item.price,
    description: item.description,
    available: item.available,
    sortOrder: item.sortOrder,
  }))

  const tableInfo = {
    id: tableRecord.id,
    number: tableRecord.number,
    name: tableRecord.name,
  }

  // MenuView client component will be created in T02.
  // For now, render a placeholder that proves the server component works.
  return (
    <div className="min-h-dvh bg-amber-50">
      <header className="sticky top-0 z-10 border-b border-amber-200/60 bg-amber-50/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🧋</span>
          <h1 className="text-base font-semibold text-amber-950">
            {tableInfo.name}
          </h1>
        </div>
      </header>

      {/*
        MenuView will receive:
          items={items}
          table={tableInfo}
        For now, render item count as proof-of-life.
      */}
      <main className="px-4 py-6">
        <p className="text-sm text-amber-800/70">
          Đang tải thực đơn… ({items.length} món)
        </p>
      </main>
    </div>
  )
}
