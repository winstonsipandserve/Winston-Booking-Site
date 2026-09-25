import type { MembershipTier, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  FOUNDING_MEMBER_CAP,
  FOUNDING_PREMIER_PRICE_CENTAVOS,
  standardTierPriceCentavos,
} from '@/lib/membership-pricing'
import { MEMBERSHIP_PAYMENT_LINK_TOKEN_HOURS } from '@/lib/membership-payment-link'

// Founding Members (docs/business.md → Membership → Founding Members): the first 100 paid
// Winston Premier activations pay ₱5,000 for their first year only. Founding status itself is
// a permanent flag on the membership, never a tier (docs/decisions.md) — every later Premier
// renewal by that customer is priced at the standard rate but still carries the flag.
//
// The price is fixed when a MembershipPayment row is created, because that amount is what
// PayMongo charges. A seat therefore counts as taken by a paid Founding membership OR by an
// unpaid, newly-Founding-priced payment still inside its link lifetime, so two applicants
// cannot both be sold the last seat while one of them is still at checkout. Once a customer
// holds Founding status, every later Premier payment of theirs is flagged Founding (for the
// permanent badge) but priced standard — it does not consume a seat, since they already hold
// one.

export interface MembershipPriceQuote {
  amountCentavos: number
  isFounding: boolean
}

type Db = Prisma.TransactionClient | typeof prisma

async function customerIsFounding(db: Db, customerId: string): Promise<boolean> {
  const founding = await db.membership.findFirst({
    where: { customerId, isFounding: true },
    select: { id: true },
  })
  return founding !== null
}

/** Distinct customers holding or currently checking out a Founding seat. */
export async function countFoundingSeatsTaken(db: Db = prisma): Promise<number> {
  const pendingCutoff = new Date(Date.now() - MEMBERSHIP_PAYMENT_LINK_TOKEN_HOURS * 60 * 60 * 1000)
  const [paid, pending] = await Promise.all([
    db.membership.findMany({
      where: { isFounding: true },
      select: { customerId: true },
      distinct: ['customerId'],
    }),
    db.membershipPayment.findMany({
      where: { isFounding: true, status: 'pending', createdAt: { gte: pendingCutoff } },
      select: { customerId: true },
      distinct: ['customerId'],
    }),
  ])
  const customers = new Set<string>()
  for (const row of paid) customers.add(row.customerId)
  for (const row of pending) customers.add(row.customerId)
  return customers.size
}

export async function foundingSeatsRemaining(db: Db = prisma): Promise<number> {
  return Math.max(0, FOUNDING_MEMBER_CAP - (await countFoundingSeatsTaken(db)))
}

/**
 * Price a membership payment for this customer and tier. Read-only: safe for display. To
 * actually reserve a seat, call it inside `withFoundingSeatLock` and insert the payment row
 * in the same transaction.
 */
export async function quoteMembershipPrice(
  db: Db,
  customerId: string,
  tier: MembershipTier,
): Promise<MembershipPriceQuote> {
  if (tier !== 'premier') {
    return { amountCentavos: standardTierPriceCentavos(tier), isFounding: false }
  }
  if (await customerIsFounding(db, customerId)) {
    // The ₱5,000 price was a one-time perk on the qualifying first activation. A Founding
    // Member's later Premier renewals are priced at the standard rate but still carry the
    // flag, so the badge and merchandise history are never lost (docs/decisions.md).
    return { amountCentavos: standardTierPriceCentavos(tier), isFounding: true }
  }
  if ((await countFoundingSeatsTaken(db)) < FOUNDING_MEMBER_CAP) {
    return { amountCentavos: FOUNDING_PREMIER_PRICE_CENTAVOS, isFounding: true }
  }
  return { amountCentavos: standardTierPriceCentavos(tier), isFounding: false }
}

/**
 * Serialises seat counting and payment-row insertion so concurrent checkouts cannot both
 * take the last Founding seat. Same advisory-lock technique as the booking hold cap.
 */
export async function withFoundingSeatLock<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('membership_founding_seats'))`
    return fn(tx)
  })
}
