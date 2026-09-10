import { AuthRateLimitScope } from '@prisma/client'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'

const WINDOW_MS = 15 * 60 * 1000

const LIMITS: Record<
  AuthRateLimitScope,
  { accountAttempts: number; ipAttempts: number }
> = {
  admin_login: { accountAttempts: 5, ipAttempts: 20 },
  member_login: { accountAttempts: 5, ipAttempts: 20 },
  admin_password_reset: { accountAttempts: 3, ipAttempts: 10 },
  member_password_reset: { accountAttempts: 3, ipAttempts: 10 },
}

interface RateLimitKey {
  identifierHash: string
  maximumAttempts: number
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',', 1)[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

function hashIdentifier(identifier: string): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET is not set')
  }
  return createHmac('sha256', secret).update(identifier).digest('hex')
}

function getRateLimitKeys(
  scope: AuthRateLimitScope,
  request: Request,
  accountIdentifier: string,
): RateLimitKey[] {
  const limits = LIMITS[scope]
  return [
    {
      identifierHash: hashIdentifier(`account:${accountIdentifier.trim().toLowerCase()}`),
      maximumAttempts: limits.accountAttempts,
    },
    {
      identifierHash: hashIdentifier(`ip:${getClientIp(request)}`),
      maximumAttempts: limits.ipAttempts,
    },
  ]
}

export async function consumeAuthRateLimitAttempt(
  scope: AuthRateLimitScope,
  request: Request,
  accountIdentifier: string,
): Promise<boolean> {
  const keys = getRateLimitKeys(scope, request, accountIdentifier)
  const cutoff = new Date(Date.now() - WINDOW_MS)

  // Every request performs bounded retention, so this abuse-control table never becomes
  // a long-lived activity log. The createdAt index keeps this cleanup targeted.
  await prisma.authRateLimitAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } })

  return prisma.$transaction(async (tx) => {
    // Lock both buckets in a deterministic order. Without this, a burst of parallel
    // requests could all observe the same pre-insert count and bypass the limit.
    const lockIds = keys
      .map((key) => `${scope}:${key.identifierHash}`)
      .sort()
    for (const lockId of lockIds) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockId}))`
    }

    const counts = await Promise.all(
      keys.map((key) =>
        tx.authRateLimitAttempt.count({
          where: { scope, identifierHash: key.identifierHash, createdAt: { gte: cutoff } },
        }),
      ),
    )

    if (counts.some((count, index) => count >= keys[index].maximumAttempts)) {
      return false
    }

    await tx.authRateLimitAttempt.createMany({
      data: keys.map((key) => ({ scope, identifierHash: key.identifierHash })),
    })
    return true
  })
}
