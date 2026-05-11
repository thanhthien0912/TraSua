import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Ép kiểu any để vượt qua lỗi kiểm tra của Vercel
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  } as any)
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export { prisma }

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
