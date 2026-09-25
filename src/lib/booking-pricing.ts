import { RateTier, ResourceCategory } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { MAX_COURT_DURATION_MINUTES } from '@/lib/booking-limits'
import { tierDiscountCentavos } from '@/lib/membership-pricing'
import type { BirthdayPerkKind } from '@/lib/member-perks'

export const COURT_DURATION_CAP_ERROR = `Court bookings must be ${MAX_COURT_DURATION_MINUTES / 60} hours or shorter`

export interface PriceBookingInput {
  resourceTypeId: string
  category: ResourceCategory
  durationMinutes: number
  /** Non-member guests only — a guest who is themself a member is free and never counted here. */
  guestCount: number
  coaching: boolean
  coachingPaxCount: number | null
  /** A membership term covers the slot: member coaching rates apply. */
  isMember: boolean
  /** Tier discount off the base court/simulator rate (MEMBERSHIP_TIER_PLANS); 0 for non-members. */
  bookingDiscountPercent: number
  /** Guests whose fee is waived by complimentary guest passes (already validated ≤ guestCount). */
  guestPassesUsed?: number
  /** Birthday-month court hour on this booking: replaces the tier discount (docs/business.md). */
  birthdayPerk?: BirthdayPerkKind | null
}

export interface SelectedAddOn {
  service: 'coaching_fee'
  addOnServiceId: string
  addOnPricingRuleId: string
  paxCount: number | null
  amountCentavos: number
}

export interface PriceBookingResult {
  /** Discounted base rate + guest fee (what Booking.totalAmountCentavos stores). */
  totalAmountCentavos: number
  /** The tier (or birthday) discount already taken off inside totalAmountCentavos. */
  memberDiscountCentavos: number
  /** Guest fee actually charged, after any guest passes. */
  guestFeeCentavos: number
  guestPassesUsed: number
  birthdayPerkApplied: boolean
  addOns: SelectedAddOn[]
  addOnsTotalCentavos: number
}

export interface PriceBookingError {
  error: string
  status: 400 | 500
}

export async function priceBooking(
  input: PriceBookingInput,
): Promise<PriceBookingResult | PriceBookingError> {
  const {
    resourceTypeId,
    category,
    durationMinutes,
    guestCount,
    coaching,
    coachingPaxCount,
    isMember,
    bookingDiscountPercent,
    guestPassesUsed = 0,
    birthdayPerk = null,
  } = input

  const isCourt = category === 'court'
  const rateTier: RateTier = isMember ? 'member' : 'non_member'

  if (isCourt && durationMinutes % 60 !== 0) {
    return { error: 'Court bookings must be a positive multiple of 60 minutes', status: 400 }
  }
  if (isCourt && durationMinutes > MAX_COURT_DURATION_MINUTES) {
    return { error: COURT_DURATION_CAP_ERROR, status: 400 }
  }

  const pricingRule = await prisma.pricingRule.findUnique({
    where: {
      resourceTypeId_durationMinutes: {
        resourceTypeId,
        durationMinutes: isCourt ? 60 : durationMinutes,
      },
    },
  })
  if (!pricingRule) {
    return { error: 'No pricing available for this resource and duration', status: 400 }
  }

  let guestFeeCentavos = 0
  if (guestCount > 0) {
    const guestFeeRule = await prisma.guestFeeRule.findFirst()
    if (!guestFeeRule) {
      console.error('GuestFeeRule table is empty — cannot price guest fee')
      return { error: 'Internal server error', status: 500 }
    }
    guestFeeCentavos = Math.max(0, guestCount - guestPassesUsed) * guestFeeRule.amountCentavos
  }

  const baseAmountCentavos = isCourt
    ? pricingRule.priceCentavos * (durationMinutes / 60)
    : pricingRule.priceCentavos
  // The birthday hour replaces the tier discount on that booking, never stacks on it.
  const memberDiscountCentavos = birthdayPerk
    ? birthdayPerk === 'free'
      ? baseAmountCentavos
      : Math.round(baseAmountCentavos / 2)
    : tierDiscountCentavos(baseAmountCentavos, bookingDiscountPercent)
  const totalAmountCentavos = baseAmountCentavos - memberDiscountCentavos + guestFeeCentavos

  const selectedAddOns: SelectedAddOn[] = []

  if (coaching) {
    const coachingService = await prisma.addOnService.findUnique({ where: { slug: 'coaching_fee' } })
    // Prisma's compound-unique input rejects null for a nullable field at runtime
    // (known Prisma limitation), so this can't use findUnique on the compound key.
    const coachingRule = coachingService
      ? await prisma.addOnPricingRule.findFirst({
          where: {
            addOnServiceId: coachingService.id,
            resourceTypeId,
            rateTier,
            paxCount: coachingPaxCount,
          },
        })
      : null
    if (!coachingService || !coachingRule) {
      return { error: 'Coaching not available for this resource and rate tier', status: 400 }
    }
    selectedAddOns.push({
      service: 'coaching_fee',
      addOnServiceId: coachingService.id,
      addOnPricingRuleId: coachingRule.id,
      paxCount: coachingPaxCount,
      amountCentavos: coachingRule.priceCentavos,
    })
  }

  const addOnsTotalCentavos = selectedAddOns.reduce((sum, addOn) => sum + addOn.amountCentavos, 0)

  return {
    totalAmountCentavos,
    memberDiscountCentavos,
    guestFeeCentavos,
    guestPassesUsed,
    birthdayPerkApplied: birthdayPerk !== null,
    addOns: selectedAddOns,
    addOnsTotalCentavos,
  }
}

// Single source of truth for a booking's actual grand total (base + guest fee + add-ons),
// matching what's actually charged via PayMongo or credited via membership credit.
export function bookingGrandTotalCentavos(booking: {
  totalAmountCentavos: number
  addOns: { amountCentavos: number }[]
}): number {
  return (
    booking.totalAmountCentavos + booking.addOns.reduce((sum, a) => sum + a.amountCentavos, 0)
  )
}
