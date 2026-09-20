import type { MembershipTier } from '@prisma/client'
import { endOfManilaDayMonthsFrom } from '@/lib/manila-date'

// Fixed plan prices (docs/business.md → Membership). Not admin-editable — unlike
// PricingRule/GuestFeeRule, these are flat plan prices, not DB-driven rates. Every plan is a
// 12-month term and the price is the membership fee in full: no credit is granted.
export const MEMBERSHIP_TIER_PLANS: Record<
  MembershipTier,
  { name: string; totalCentavos: number; months: number; bookingDiscountPercent: number; guestPasses: number; advanceBookingDays: number }
> = {
  player: { name: 'Winston Player', totalCentavos: 350_000, months: 12, bookingDiscountPercent: 5, guestPasses: 2, advanceBookingDays: 5 },
  premier: { name: 'Winston Premier', totalCentavos: 650_000, months: 12, bookingDiscountPercent: 10, guestPasses: 4, advanceBookingDays: 7 },
  elite: { name: 'Winston Elite', totalCentavos: 950_000, months: 12, bookingDiscountPercent: 15, guestPasses: 6, advanceBookingDays: 10 },
}

export const MEMBERSHIP_TIER_ORDER: MembershipTier[] = ['player', 'premier', 'elite']

/** Founding Members: the first 100 paid Winston Premier activations. */
export const FOUNDING_MEMBER_CAP = 100

/** Premier price for a Founding Member — on activation and on every later Premier renewal. */
export const FOUNDING_PREMIER_PRICE_CENTAVOS = 500_000

/**
 * The tier discount on a base court/simulator amount, in centavos, rounded half-up
 * (docs/business.md → Member discount). Never applied to the guest fee or coaching.
 */
export function tierDiscountCentavos(baseAmountCentavos: number, discountPercent: number): number {
  if (discountPercent <= 0) return 0
  return Math.round((baseAmountCentavos * discountPercent) / 100)
}

/** Standard price of a plan, ignoring Founding status. */
export function standardTierPriceCentavos(tier: MembershipTier): number {
  return MEMBERSHIP_TIER_PLANS[tier].totalCentavos
}

/** Label for a paid tier, e.g. "Winston Premier · Founding Member". */
export function formatMembershipPlanLabel(tier: MembershipTier, isFounding: boolean): string {
  const name = MEMBERSHIP_TIER_PLANS[tier].name
  return isFounding ? `${name} · Founding Member` : name
}

// A term runs from its start to 23:59:59.999 Asia/Manila on the same calendar day
// `months` later, so members never lapse mid-day (see docs/business.md → Membership).
export function computeMembershipEndDate(startDate: Date, tier: MembershipTier): Date {
  return endOfManilaDayMonthsFrom(startDate, MEMBERSHIP_TIER_PLANS[tier].months)
}
