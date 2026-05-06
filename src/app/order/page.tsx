import { prisma } from '@/lib/prisma'
import ErrorPage from '@/components/order/ErrorPage'
import MenuView from '@/components/order/MenuView'
import CartUI from '@/components/order/CartUI'
import { CartProvider } from '@/components/order/CartProvider'

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

  return (
    <div className="min-h-dvh bg-amber-50">
      <CartProvider tableId={tableInfo.id}>
        <CartUI tableId={tableInfo.id} tableNumber={tableInfo.number}>
          <MenuView menuItems={items} table={tableInfo} />
        </CartUI>
      </CartProvider>
    </div>
  )
}
