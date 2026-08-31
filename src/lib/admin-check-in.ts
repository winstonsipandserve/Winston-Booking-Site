import type { Customer } from '@prisma/client'
import { getLatestMembershipByCustomerId, buildMembershipDisplayFields } from '@/lib/membership-latest'

export async function resolveAdminCheckInResult(customer: Customer) {
  const latestMembership = await getLatestMembershipByCustomerId(customer.id)
  if (!latestMembership) {
    return { found: true as const, hasMembership: false as const, name: customer.name }
  }

  const displayFields = await buildMembershipDisplayFields(latestMembership)

  return {
    found: true as const,
    hasMembership: true as const,
    name: customer.name,
    email: customer.email,
    tierName: displayFields.tierName,
    isExpired: displayFields.isExpired,
    expiryDateLabel: displayFields.expiryDateLabel,
    remainingCreditCentavos: displayFields.remainingCreditCentavos,
    creditCentavos: displayFields.creditCentavos,
  }
}
