import { RateTier, ResourceCategory } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface PriceBookingInput {
  resourceTypeId: string
  category: ResourceCategory
  durationMinutes: number
  guestCount: number
  ballBoy: boolean
  coaching: boolean
  coachingPaxCount: number | null
  isMember: boolean
}

export interface SelectedAddOn {
  service: 'ball_boy' | 'coaching_fee'
  addOnServiceId: string
  addOnPricingRuleId: string
  paxCount: number | null
  amountCentavos: number
}

export interface PriceBookingResult {
  totalAmountCentavos: number
  addOns: SelectedAddOn[]
  addOnsTotalCentavos: number
  guestFeeWaived: boolean
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
    ballBoy,
    coaching,
    coachingPaxCount,
    isMember,
  } = input

  const isCourt = category === 'court'
  const rateTier: RateTier = isMember ? 'member' : 'non_member'

  if (isCourt && durationMinutes % 60 !== 0) {
    return { error: 'Court bookings must be a positive multiple of 60 minutes', status: 400 }
  }

  const pricingRule = await prisma.pricingRule.findUnique({
    where: {
      resourceTypeId_rateTier_durationMinutes: {
        resourceTypeId,
        rateTier,
        durationMinutes: isCourt ? 60 : durationMinutes,
      },
    },
  })
  if (!pricingRule) {
    return { error: 'No pricing available for this resource, rate tier, and duration', status: 400 }
  }

  const isNonMemberCourt = isCourt && rateTier === 'non_member'
  let guestFeeWaived = false
  if (guestCount > 0 && !isNonMemberCourt) {
    if (!isMember) {
      return { error: 'guestCount only applies to non-member court bookings', status: 400 }
    }
    guestFeeWaived = true
  }

  let guestFeeCentavos = 0
  if (guestCount > 0 && !guestFeeWaived) {
    const guestFeeRule = await prisma.guestFeeRule.findFirst()
    if (!guestFeeRule) {
      console.error('GuestFeeRule table is empty — cannot price guest fee')
      return { error: 'Internal server error', status: 500 }
    }
    guestFeeCentavos = guestCount * guestFeeRule.amountCentavos
  }

  const baseAmountCentavos = isCourt
    ? pricingRule.priceCentavos * (durationMinutes / 60)
    : pricingRule.priceCentavos
  const totalAmountCentavos = baseAmountCentavos + guestFeeCentavos

  const selectedAddOns: SelectedAddOn[] = []

  if (ballBoy) {
    const ballBoyService = await prisma.addOnService.findUnique({ where: { slug: 'ball_boy' } })
    // Prisma's compound-unique input rejects null for a nullable field at runtime
    // (known Prisma limitation), so this can't use findUnique on the compound key.
    const ballBoyRule = ballBoyService
      ? await prisma.addOnPricingRule.findFirst({
          where: {
            addOnServiceId: ballBoyService.id,
            resourceTypeId,
            rateTier,
            paxCount: null,
          },
        })
      : null
    if (!ballBoyService || !ballBoyRule) {
      return { error: 'Ball boy not available for this resource and rate tier', status: 400 }
    }
    selectedAddOns.push({
      service: 'ball_boy',
      addOnServiceId: ballBoyService.id,
      addOnPricingRuleId: ballBoyRule.id,
      paxCount: null,
      amountCentavos: ballBoyRule.priceCentavos,
    })
  }

  if (coaching) {
    const coachingService = await prisma.addOnService.findUnique({ where: { slug: 'coaching_fee' } })
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

  return { totalAmountCentavos, addOns: selectedAddOns, addOnsTotalCentavos, guestFeeWaived }
}
