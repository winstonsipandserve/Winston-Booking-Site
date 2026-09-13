import { AuthRateLimitScope } from '@prisma/client'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'

const WINDOW_MS = 15 * 60 * 1000

// Credential/reset scopes are keyed on account + IP. `booking_hold` builds its own keys in
// src/lib/booking-hold-abuse.ts and is deliberately absent here.
const LIMITS: Partial<
  Record<AuthRateLimitScope, { accountAttempts: number; ipAttempts: number }>
> = {
  admin_login: { accountAttempts: 5, ipAttempts: 20 },
  member_login: { accountAttempts: 5, ipAttempts: 20 },
  admin_password_reset: { accountAttempts: 3, ipAttempts: 10 },
  member_password_reset: { accountAttempts: 3, ipAttempts: 10 },
}

export interface RateLimitKey {
  identifierHash: string
  maximumAttempts: number
}

/** Vercel overwrites x-forwarded-for with the real client IP, so the first hop is trustworthy there. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',', 1)[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

export function hashIdentifier(identifier: string): string {
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
  if (!limits) throw new Error(`No account/IP limits configured for scope ${scope}`)
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
  return consumeRateLimitAttempt(scope, getRateLimitKeys(scope, request, accountIdentifier))
}

/**
 * Records one attempt against every key, or records nothing and returns false when any
 * key is already at its limit inside the 15-minute window.
 */
export async function consumeRateLimitAttempt(
  scope: AuthRateLimitScope,
  keys: RateLimitKey[],
): Promise<boolean> {
  const cutoff = new Date(Date.now() - WINDOW_MS)

  // Every request performs bounded retention, so this abuse-control table never becomes
  // a long-lived activity log. The createdAt index keeps this cleanup targeted.
  await prisma.authRateLimitAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } })

  return prisma.$transaction(async (tx) => {
    // Lock every bucket in a deterministic order. Without this, a burst of parallel
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
    // Waiters queue on the advisory lock, so a burst of parallel requests for one bucket
    // needs more than Prisma's 5s default before the last one gets its turn (P2028).
  }, { maxWait: 5000, timeout: 15000 })
}
