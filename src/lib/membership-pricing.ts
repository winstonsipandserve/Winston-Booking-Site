import type { MembershipTier } from '@prisma/client'

// Fixed plan prices (see PROJECT_CONTEXT.md → Membership Tiers). Not admin-editable —
// unlike PricingRule/GuestFeeRule, these are flat plan prices, not DB-driven rates.
export const MEMBERSHIP_TIER_PLANS: Record<
  MembershipTier,
  { totalCentavos: number; activationFeeCentavos: number; creditCentavos: number; months: number }
> = {
  three_month: { totalCentavos: 550_000, activationFeeCentavos: 200_000, creditCentavos: 350_000, months: 3 },
  six_month: { totalCentavos: 1_250_000, activationFeeCentavos: 600_000, creditCentavos: 650_000, months: 6 },
  twelve_month: { totalCentavos: 2_250_000, activationFeeCentavos: 1_050_000, creditCentavos: 1_200_000, months: 12 },
}

export function computeMembershipEndDate(startDate: Date, tier: MembershipTier): Date {
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + MEMBERSHIP_TIER_PLANS[tier].months)
  return endDate
}
