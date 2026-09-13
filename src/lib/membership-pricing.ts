import type { MembershipTier } from '@prisma/client'
import { endOfManilaDayMonthsFrom } from '@/lib/manila-date'

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

// A term runs from its start to 23:59:59.999 Asia/Manila on the same calendar day
// `months` later, so members never lapse mid-day (see docs/business.md → Membership).
export function computeMembershipEndDate(startDate: Date, tier: MembershipTier): Date {
  return endOfManilaDayMonthsFrom(startDate, MEMBERSHIP_TIER_PLANS[tier].months)
}
