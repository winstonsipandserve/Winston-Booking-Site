import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  const client = new PrismaClient({
    log: [{ emit: 'event', level: 'query' }],
  })
  client.$on('query' as never, (e: { query: string; duration: number }) => {
    console.log(`[PRISMA] ${e.duration}ms :: ${e.query}`)
  })
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
