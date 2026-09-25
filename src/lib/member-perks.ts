import type { Membership, Prisma, ResourceCategory } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { occupyingSlotCondition } from '@/lib/booking-hold'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { manilaDateKey } from '@/lib/manila-date'
import { categoryHasMemberPricing } from '@/lib/booking-limits'

// Per-term member perks (docs/business.md → Membership): complimentary guest passes and the
// birthday-month court hour. Neither is a counter on the membership. A perk is "used" by a
// booking that occupies a slot inside the term — confirmed, or a hold still inside its
// window — so an abandoned hold releases whatever it reserved without any bookkeeping. Call
// these inside the booking transaction, after the per-client advisory lock, to reserve.

type Db = Prisma.TransactionClient | typeof prisma

/** Slot-occupying bookings by this customer whose start falls inside the term. */
function termBookingsWhere(membership: Membership, now: Date): Prisma.BookingWhereInput {
  return {
    AND: [
      {
        customerId: membership.customerId,
        startTime: { gte: membership.startDate, lte: membership.endDate },
      },
      occupyingSlotCondition(now),
    ],
  }
}

export interface GuestPassStatus {
  allowance: number
  used: number
  remaining: number
}

export async function getGuestPassStatus(
  db: Db,
  membership: Membership,
  now = new Date(),
): Promise<GuestPassStatus> {
  const allowance = MEMBERSHIP_TIER_PLANS[membership.tier].guestPasses
  const agg = await db.booking.aggregate({
    _sum: { guestPassesUsed: true },
    where: termBookingsWhere(membership, now),
  })
  const used = agg._sum.guestPassesUsed ?? 0
  return { allowance, used, remaining: Math.max(0, allowance - used) }
}

/** Month of the slot's Manila date, 1–12. */
export function manilaMonth(date: Date): number {
  return Number(manilaDateKey(date).slice(5, 7))
}

/** The customer's birthday month, 1–12, or null when no date of birth is on file. */
export function birthdayMonthOf(dateOfBirth: Date | null): number | null {
  // Stored as a DATE; Prisma returns it at UTC midnight, so read the UTC month.
  return dateOfBirth ? dateOfBirth.getUTCMonth() + 1 : null
}

export type BirthdayPerkKind = 'half' | 'free'

/** What the birthday hour does for a tier: Player gets 50% off the base rate, the rest get it free. */
export function birthdayPerkKindForTier(tier: Membership['tier']): BirthdayPerkKind {
  return tier === 'player' ? 'half' : 'free'
}

export interface BirthdayPerkStatus {
  /** The customer's birthday month, or null when unknown. */
  birthdayMonth: number | null
  kind: BirthdayPerkKind
  /** Already redeemed on a slot-occupying booking inside this term. */
  used: boolean
}

export async function getBirthdayPerkStatus(
  db: Db,
  membership: Membership,
  dateOfBirth: Date | null,
  now = new Date(),
): Promise<BirthdayPerkStatus> {
  const usedRow = await db.booking.findFirst({
    where: { AND: [termBookingsWhere(membership, now), { birthdayPerkApplied: true }] },
    select: { id: true },
  })
  return {
    birthdayMonth: birthdayMonthOf(dateOfBirth),
    kind: birthdayPerkKindForTier(membership.tier),
    used: usedRow !== null,
  }
}

/**
 * Whether the birthday hour may be redeemed on a slot: the member has a birthday on file,
 * the slot's Manila month is that month, the booking is exactly one hour on a court or
 * simulator (never a space), and the term has not used it yet.
 */
export function birthdayPerkEligible(
  status: BirthdayPerkStatus,
  slotStart: Date,
  durationMinutes: number,
  category: ResourceCategory,
): boolean {
  return (
    categoryHasMemberPricing(category) &&
    status.birthdayMonth !== null &&
    !status.used &&
    durationMinutes === 60 &&
    manilaMonth(slotStart) === status.birthdayMonth
  )
}
