import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [{ emit: 'event', level: 'query' }],
  })

prisma.$on('query' as never, (e: { query: string; duration: number }) => {
  console.log(`[PRISMA] ${e.duration}ms :: ${e.query}`)
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
