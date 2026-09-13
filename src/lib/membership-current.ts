import type { Membership, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// Canonical membership-row selection. `endDate` alone decides whether a row is live —
// `Membership.status` is never written as `expired` anywhere, so it is deliberately not
// consulted here (see docs/database.md → "Membership status"). Every surface that needs
// "the member's membership" must go through these helpers so that account, booking,
// admin, check-in, reapplication, and the reminders cron agree on the same row.

/** Members may renew once their current term is within this many days of ending. */
export const RENEWAL_WINDOW_DAYS = 14

/**
 * Deterministic ordering for "the most relevant row": latest end first, then latest
 * start, then id as a stable tie-breaker. A customer with an early renewal has two live
 * rows (current + scheduled), so ordering by endDate puts the scheduled one first.
 */
export const MEMBERSHIP_RELEVANCE_ORDER: Prisma.MembershipOrderByWithRelationInput[] = [
  { endDate: 'desc' },
  { startDate: 'desc' },
  { id: 'asc' },
]

export function membershipCoversInstant(membership: Pick<Membership, 'startDate' | 'endDate'>, at: Date): boolean {
  return membership.startDate <= at && membership.endDate >= at
}

/** The membership whose term covers `at` (usually now, or a booking's slot start). */
export async function getMembershipActiveAt(customerId: string, at: Date): Promise<Membership | null> {
  return prisma.membership.findFirst({
    where: { customerId, startDate: { lte: at }, endDate: { gte: at } },
    orderBy: MEMBERSHIP_RELEVANCE_ORDER,
  })
}

/**
 * The row to display for a customer: the one covering now if any, otherwise the one with
 * the latest endDate (a scheduled renewal, or the most recently expired term).
 */
export async function getCurrentMembership(customerId: string): Promise<Membership | null> {
  const activeNow = await getMembershipActiveAt(customerId, new Date())
  if (activeNow) return activeNow
  return prisma.membership.findFirst({
    where: { customerId },
    orderBy: MEMBERSHIP_RELEVANCE_ORDER,
  })
}

/** Batched form of `getCurrentMembership` for list views. */
export async function getCurrentMembershipsByCustomerIds(customerIds: string[]): Promise<Map<string, Membership>> {
  if (customerIds.length === 0) return new Map()
  const now = new Date()
  const memberships = await prisma.membership.findMany({
    where: { customerId: { in: customerIds } },
    orderBy: MEMBERSHIP_RELEVANCE_ORDER,
  })

  const byCustomer = new Map<string, Membership>()
  for (const membership of memberships) {
    const existing = byCustomer.get(membership.customerId)
    if (!existing) {
      byCustomer.set(membership.customerId, membership)
      continue
    }
    // Rows arrive latest-endDate first; prefer the first row that actually covers now.
    if (!membershipCoversInstant(existing, now) && membershipCoversInstant(membership, now)) {
      byCustomer.set(membership.customerId, membership)
    }
  }
  return byCustomer
}

/** Every row whose term has not ended yet (current term plus any scheduled renewal), earliest first. */
export async function getLiveMemberships(customerId: string, now = new Date()): Promise<Membership[]> {
  return prisma.membership.findMany({
    where: { customerId, endDate: { gte: now } },
    orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
  })
}

export type RenewalEligibility =
  | { eligible: true; current: Membership | null }
  | { eligible: false; reason: 'not_in_window' | 'already_scheduled'; current: Membership }

/**
 * A member can renew when they have no live membership (never had one, or it lapsed), or
 * when their single live term ends within RENEWAL_WINDOW_DAYS. A second live row means a
 * renewal is already scheduled.
 */
export async function getRenewalEligibility(customerId: string, now = new Date()): Promise<RenewalEligibility> {
  const live = await getLiveMemberships(customerId, now)
  if (live.length === 0) return { eligible: true, current: null }
  if (live.length > 1) return { eligible: false, reason: 'already_scheduled', current: live[live.length - 1] }

  const [current] = live
  const windowEnd = new Date(now.getTime() + RENEWAL_WINDOW_DAYS * 86_400_000)
  if (current.endDate <= windowEnd) return { eligible: true, current }
  return { eligible: false, reason: 'not_in_window', current }
}
