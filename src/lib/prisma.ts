import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Chỉ truyền URL nếu nó tồn tại (tránh lỗi lúc Build trên Vercel)
  const options = process.env.DATABASE_URL 
    ? { datasourceUrl: process.env.DATABASE_URL } 
    : {}
    
  return new PrismaClient(options as any)
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export { prisma }

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
