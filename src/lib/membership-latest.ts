import { prisma } from '@/lib/prisma'
import type { Membership } from '@prisma/client'
import { formatMembershipTier } from '@/lib/format'
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
  tierName: string
  activationCentavos: number
  creditCentavos: number
  remainingCreditCentavos: number
  expiryDateLabel: string
  isExpired: boolean
}

export async function buildMembershipDisplayFields(
  membership: Membership,
): Promise<MembershipDisplayFields> {
  // The original grant is the first activation *or* renewal credit — a renewed term has a
  // `renewal` row instead of an `activation` one and must not fall back to the live balance.
  const grantTransaction = await prisma.membershipCreditTransaction.findFirst({
    where: { membershipId: membership.id, reason: { in: ['activation', 'renewal'] } },
    orderBy: { createdAt: 'asc' },
  })

  const creditCentavos = grantTransaction?.amountCentavos ?? membership.creditBalanceCentavos

  return {
    tierName: formatMembershipTier(membership.tier),
    activationCentavos: membership.activationFeeCentavos,
    creditCentavos,
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
