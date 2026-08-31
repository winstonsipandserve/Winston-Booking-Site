import { prisma } from '@/lib/prisma'
import type { Membership } from '@prisma/client'
import { formatMembershipTier } from '@/lib/format'

export async function getLatestMembershipsByCustomerIds(
  customerIds: string[],
): Promise<Map<string, Membership>> {
  const memberships = await prisma.membership.findMany({
    where: { customerId: { in: customerIds } },
    orderBy: { startDate: 'desc' },
  })

  const latestByCustomerId = new Map<string, Membership>()
  for (const membership of memberships) {
    if (!latestByCustomerId.has(membership.customerId)) {
      latestByCustomerId.set(membership.customerId, membership)
    }
  }
  return latestByCustomerId
}

export async function getLatestMembershipByCustomerId(
  customerId: string,
): Promise<Membership | null> {
  const latestByCustomerId = await getLatestMembershipsByCustomerIds([customerId])
  return latestByCustomerId.get(customerId) ?? null
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
  const activationTransaction = await prisma.membershipCreditTransaction.findFirst({
    where: { membershipId: membership.id, reason: 'activation' },
    orderBy: { createdAt: 'asc' },
  })

  const creditCentavos = activationTransaction?.amountCentavos ?? membership.creditBalanceCentavos

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
