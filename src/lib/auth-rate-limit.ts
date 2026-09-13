import { AuthRateLimitScope } from '@prisma/client'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'

const WINDOW_MS = 15 * 60 * 1000

// Password-reset scopes count every request against email + IP: the per-email cap is meant
// to be global so nobody can flood a victim's inbox with reset emails. Login scopes use
// `getLoginRateLimitKeys` instead, and `booking_hold` builds its own keys in
// src/lib/booking-hold-abuse.ts.
const REQUEST_LIMITS: Partial<
  Record<AuthRateLimitScope, { accountAttempts: number; ipAttempts: number }>
> = {
  admin_password_reset: { accountAttempts: 3, ipAttempts: 10 },
  member_password_reset: { accountAttempts: 3, ipAttempts: 10 },
}

// Login scopes count *failures* only, and the strict bucket is the (account, IP) pair so a
// stranger's wrong guesses never lock the real owner out from their own IP. The global
// per-account bucket is a loose backstop against a distributed password spray.
const LOGIN_LIMITS = {
  accountIpFailures: 5,
  ipFailures: 20,
  accountFailures: 30,
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
  const limits = REQUEST_LIMITS[scope]
  if (!limits) throw new Error(`No account/IP request limits configured for scope ${scope}`)
  return [
    {
      identifierHash: hashIdentifier(`account:${normalizeAccount(accountIdentifier)}`),
      maximumAttempts: limits.accountAttempts,
    },
    {
      identifierHash: hashIdentifier(`ip:${getClientIp(request)}`),
      maximumAttempts: limits.ipAttempts,
    },
  ]
}

function normalizeAccount(accountIdentifier: string): string {
  return accountIdentifier.trim().toLowerCase()
}

/** The three failure buckets for a credential sign-in: account+IP (strict), IP, account (backstop). */
export function getLoginRateLimitKeys(
  request: Request,
  accountIdentifier: string,
): RateLimitKey[] {
  const account = normalizeAccount(accountIdentifier)
  const ip = getClientIp(request)
  return [
    { identifierHash: hashIdentifier(`account-ip:${account}|${ip}`), maximumAttempts: LOGIN_LIMITS.accountIpFailures },
    { identifierHash: hashIdentifier(`ip:${ip}`), maximumAttempts: LOGIN_LIMITS.ipFailures },
    { identifierHash: hashIdentifier(`account:${account}`), maximumAttempts: LOGIN_LIMITS.accountFailures },
  ]
}

async function deleteExpiredAttempts(cutoff: Date): Promise<void> {
  // Every request performs bounded retention, so this abuse-control table never becomes
  // a long-lived activity log. The createdAt index keeps this cleanup targeted.
  await prisma.authRateLimitAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } })
}

/**
 * Read-only check: true when any key is already at its limit. Call before verifying the
 * credential, then `recordRateLimitFailure` only when verification fails, so successful
 * sign-ins never spend budget. Two simultaneous failures can overshoot by one; acceptable.
 */
export async function isRateLimited(scope: AuthRateLimitScope, keys: RateLimitKey[]): Promise<boolean> {
  const cutoff = new Date(Date.now() - WINDOW_MS)
  await deleteExpiredAttempts(cutoff)
  const counts = await Promise.all(
    keys.map((key) =>
      prisma.authRateLimitAttempt.count({
        where: { scope, identifierHash: key.identifierHash, createdAt: { gte: cutoff } },
      }),
    ),
  )
  return counts.some((count, index) => count >= keys[index].maximumAttempts)
}

/** Records one failure against every key, unconditionally. */
export async function recordRateLimitFailure(scope: AuthRateLimitScope, keys: RateLimitKey[]): Promise<void> {
  await prisma.authRateLimitAttempt.createMany({
    data: keys.map((key) => ({ scope, identifierHash: key.identifierHash })),
  })
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
  await deleteExpiredAttempts(cutoff)

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
