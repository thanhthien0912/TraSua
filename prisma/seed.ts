import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear tables in reverse dependency order to avoid FK constraint violations
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.table.deleteMany()

  // ─── Seed Menu Items ──────────────────────────────────────────────
  const drinks = [
    { name: 'Trà sữa trân châu', price: 35000 },
    { name: 'Trà sữa matcha', price: 40000 },
    { name: 'Trà sữa socola', price: 38000 },
    { name: 'Trà sữa khoai môn', price: 38000 },
    { name: 'Trà đào cam sả', price: 35000 },
    { name: 'Trà vải', price: 32000 },
    { name: 'Trà chanh leo', price: 30000 },
    { name: 'Cà phê sữa đá', price: 29000 },
    { name: 'Sinh tố bơ', price: 40000 },
    { name: 'Sinh tố xoài', price: 35000 },
    { name: 'Nước ép cam', price: 28000 },
    { name: 'Soda chanh', price: 25000 },
  ]

  const foods = [
    { name: 'Bánh tráng trộn', price: 25000 },
    { name: 'Khoai tây chiên', price: 30000 },
    { name: 'Gà viên chiên', price: 35000 },
    { name: 'Xúc xích nướng', price: 28000 },
    { name: 'Bánh mì bơ tỏi', price: 20000 },
    { name: 'Phô mai que', price: 32000 },
  ]

  const menuItems = await Promise.all([
    ...drinks.map((item, i) =>
      prisma.menuItem.create({
        data: {
          name: item.name,
          category: 'DRINK',
          price: item.price,
          sortOrder: i + 1,
        },
      })
    ),
    ...foods.map((item, i) =>
      prisma.menuItem.create({
        data: {
          name: item.name,
          category: 'FOOD',
          price: item.price,
          sortOrder: i + 1,
        },
      })
    ),
  ])

  // ─── Seed Tables ──────────────────────────────────────────────────
  const tables = await Promise.all(
    Array.from({ length: 15 }, (_, i) =>
      prisma.table.create({
        data: {
          number: i + 1,
          name: `Bàn ${i + 1}`,
        },
      })
    )
  )

  console.log(`Seeded ${menuItems.length} menu items and ${tables.length} tables`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
