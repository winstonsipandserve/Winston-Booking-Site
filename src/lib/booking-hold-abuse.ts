import type { Prisma } from '@prisma/client'
import {
  consumeRateLimitAttempt,
  getClientIp,
  hashIdentifier,
  type RateLimitKey,
} from '@/lib/auth-rate-limit'
import { HOLD_MINUTES } from '@/lib/booking-hold'
import {
  HOLD_CREATIONS_PER_IP_PER_WINDOW,
  HOLD_CREATIONS_PER_WINDOW,
  MAX_LIVE_HOLDS_PER_CLIENT,
} from '@/lib/booking-limits'

// Hold-spam controls for POST /api/bookings. Holds are free and occupy their slot for
// HOLD_MINUTES, so without these an anonymous script could keep every slot perpetually
// "busy". The database exclusion constraint stays the authority on overlap; this only
// bounds how many holds one client can create and keep live.

export interface HoldClient {
  /** HMAC stored on the booking row so live holds can be counted per client. */
  clientHash: string
  rateLimitKeys: RateLimitKey[]
}

/**
 * Members are identified by their customer id (plus IP as a looser second bucket);
 * anonymous bookers by IP only. Identifiers are HMAC'd before they touch the database.
 */
export function identifyHoldClient(request: Request, memberCustomerId: string | null): HoldClient {
  const ipHash = hashIdentifier(`ip:${getClientIp(request)}`)
  if (memberCustomerId) {
    const memberHash = hashIdentifier(`member:${memberCustomerId}`)
    return {
      clientHash: memberHash,
      rateLimitKeys: [
        { identifierHash: memberHash, maximumAttempts: HOLD_CREATIONS_PER_WINDOW },
        { identifierHash: ipHash, maximumAttempts: HOLD_CREATIONS_PER_IP_PER_WINDOW },
      ],
    }
  }
  return {
    clientHash: ipHash,
    rateLimitKeys: [{ identifierHash: ipHash, maximumAttempts: HOLD_CREATIONS_PER_WINDOW }],
  }
}

/** Counts one hold creation; false when the client is over its 15-minute budget. */
export function consumeHoldCreationAttempt(client: HoldClient): Promise<boolean> {
  return consumeRateLimitAttempt('booking_hold', client.rateLimitKeys)
}

/**
 * True when the client already has MAX_LIVE_HOLDS_PER_CLIENT unpaid holds inside the hold
 * window. Call inside the booking transaction after `lockHoldClient` so two parallel
 * requests cannot both pass the count.
 */
export async function hasReachedLiveHoldCap(
  tx: Prisma.TransactionClient,
  clientHash: string,
  now: Date,
): Promise<boolean> {
  const holdCutoff = new Date(now.getTime() - HOLD_MINUTES * 60000)
  const liveHolds = await tx.booking.count({
    where: { holdClientHash: clientHash, status: 'pending_payment', createdAt: { gte: holdCutoff } },
  })
  return liveHolds >= MAX_LIVE_HOLDS_PER_CLIENT
}

/** Transaction-scoped advisory lock serialising hold creation for one client. */
export async function lockHoldClient(tx: Prisma.TransactionClient, clientHash: string): Promise<void> {
  const lockId = `booking_hold:${clientHash}`
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockId}))`
}
