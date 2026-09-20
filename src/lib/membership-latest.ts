import type { Membership } from '@prisma/client'
import { MEMBERSHIP_TIER_PLANS, formatMembershipPlanLabel } from '@/lib/membership-pricing'
import { getCurrentMembership, getCurrentMembershipsByCustomerIds } from '@/lib/membership-current'

// "Latest" here means the customer's current row as defined in membership-current.ts:
// the term covering now, else the one with the latest endDate.
export async function getLatestMembershipsByCustomerIds(
  customerIds: string[],
): Promise<Map<string, Membership>> {
  return getCurrentMembershipsByCustomerIds(customerIds)
}

export async function getLatestMembershipByCustomerId(
  customerId: string,
): Promise<Membership | null> {
  return getCurrentMembership(customerId)
}

export interface MembershipDisplayFields {
  /** Plan name, with "· Founding Member" appended when applicable. */
  tierName: string
  isFounding: boolean
  bookingDiscountPercent: number
  guestPasses: number
  advanceBookingDays: number
  /** Current booking-credit balance (top-ups only — no credit is granted with a plan). */
  remainingCreditCentavos: number
  expiryDateLabel: string
  isExpired: boolean
}

export function buildMembershipDisplayFields(membership: Membership): MembershipDisplayFields {
  const plan = MEMBERSHIP_TIER_PLANS[membership.tier]
  return {
    tierName: formatMembershipPlanLabel(membership.tier, membership.isFounding),
    isFounding: membership.isFounding,
    bookingDiscountPercent: plan.bookingDiscountPercent,
    guestPasses: plan.guestPasses,
    advanceBookingDays: plan.advanceBookingDays,
    remainingCreditCentavos: membership.creditBalanceCentavos,
    expiryDateLabel: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Manila',
    }).format(membership.endDate),
    isExpired: membership.endDate < new Date(),
  }
}
