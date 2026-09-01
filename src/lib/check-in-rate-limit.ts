import { prisma } from '@/lib/prisma'

const WINDOW_MINUTES = 5
const MAX_ATTEMPTS = 10

export async function checkCheckInRateLimit(
  adminUserId: string,
): Promise<{ limited: boolean; retryAfterSeconds?: number }> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)

  await prisma.checkInLookupAttempt.deleteMany({
    where: { adminUserId, createdAt: { lt: windowStart } },
  })

  const count = await prisma.checkInLookupAttempt.count({ where: { adminUserId } })
  if (count < MAX_ATTEMPTS) {
    return { limited: false }
  }

  const oldest = await prisma.checkInLookupAttempt.findFirst({
    where: { adminUserId },
    orderBy: { createdAt: 'asc' },
  })

  const retryAfterSeconds = oldest
    ? Math.max(0, Math.ceil((oldest.createdAt.getTime() + WINDOW_MINUTES * 60 * 1000 - Date.now()) / 1000))
    : undefined

  return { limited: true, retryAfterSeconds }
}

export async function recordFailedCheckInAttempt(adminUserId: string): Promise<void> {
  await prisma.checkInLookupAttempt.create({ data: { adminUserId } })
}
