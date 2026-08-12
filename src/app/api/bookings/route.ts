import { Prisma, RateTier } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { HOLD_MINUTES } from '@/lib/booking-hold'
import { isWithinBusinessHours } from '@/lib/business-hours'
import { expirePaymongoCheckoutSession } from '@/lib/paymongo'

interface BookingRequestBody {
  resourceId?: unknown
  startTime?: unknown
  durationMinutes?: unknown
  guestCount?: unknown
  ballBoy?: unknown
  coaching?: unknown
  coachingPaxCount?: unknown
  customer?: {
    name?: unknown
    email?: unknown
    phone?: unknown
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isExclusionViolation(err: unknown): boolean {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    const message = err.message ?? ''
    return message.includes('booking_no_overlap') || message.includes('exclusion constraint')
  }
  return false
}

export async function POST(request: Request) {
  let body: BookingRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { resourceId, startTime, durationMinutes, customer } = body
  const guestCountRaw = body.guestCount ?? 0
  const ballBoyRaw = body.ballBoy ?? false
  const coachingRaw = body.coaching ?? false

  if (
    !isNonEmptyString(resourceId) ||
    !isNonEmptyString(startTime) ||
    typeof durationMinutes !== 'number' ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    typeof guestCountRaw !== 'number' ||
    !Number.isInteger(guestCountRaw) ||
    guestCountRaw < 0 ||
    typeof ballBoyRaw !== 'boolean' ||
    typeof coachingRaw !== 'boolean' ||
    !customer ||
    !isNonEmptyString(customer.name) ||
    !isNonEmptyString(customer.email) ||
    !isNonEmptyString(customer.phone)
  ) {
    return Response.json({ error: 'Missing or malformed required fields' }, { status: 400 })
  }

  const ballBoy = ballBoyRaw
  const coaching = coachingRaw

  const parsedStartTime = new Date(startTime)
  if (Number.isNaN(parsedStartTime.getTime())) {
    return Response.json({ error: 'startTime must be a valid ISO 8601 date' }, { status: 400 })
  }

  const guestCount = guestCountRaw

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: { resourceType: true },
  })
  if (!resource) {
    return Response.json({ error: 'Resource not found' }, { status: 400 })
  }
  const { resourceType } = resource
  const isCourt = resourceType.category === 'court'

  if (ballBoy && !isCourt) {
    return Response.json({ error: 'Ball boy is only available for court bookings' }, { status: 400 })
  }

  let coachingPaxCount: number | null = null
  if (coaching && isCourt) {
    const coachingPaxCountRaw = body.coachingPaxCount
    if (coachingPaxCountRaw !== 1 && coachingPaxCountRaw !== 2) {
      return Response.json(
        { error: 'coachingPaxCount must be 1 or 2 for court coaching' },
        { status: 400 },
      )
    }
    coachingPaxCount = coachingPaxCountRaw
  }

  if (isCourt && durationMinutes % 60 !== 0) {
    return Response.json(
      { error: 'Court bookings must be a positive multiple of 60 minutes' },
      { status: 400 },
    )
  }

  const endTime = new Date(parsedStartTime.getTime() + durationMinutes * 60000)

  if (!isWithinBusinessHours(parsedStartTime, endTime)) {
    return Response.json(
      { error: 'Bookings must start and end between 6:00 AM and 10:00 PM' },
      { status: 400 },
    )
  }

  const name = customer.name as string
  const email = customer.email as string
  const phone = customer.phone as string

  let customerRecord = await prisma.customer.findUnique({ where: { email } })
  if (customerRecord) {
    if (customerRecord.name !== name || customerRecord.phone !== phone) {
      customerRecord = await prisma.customer.update({
        where: { id: customerRecord.id },
        data: { name, phone },
      })
    }
  } else {
    customerRecord = await prisma.customer.create({ data: { name, email, phone } })
  }

  const now = new Date()
  const activeMembership = await prisma.membership.findFirst({
    where: { customerId: customerRecord.id, status: 'active', endDate: { gte: now } },
  })
  const rateTier: RateTier = activeMembership ? 'member' : 'non_member'

  const pricingRule = await prisma.pricingRule.findUnique({
    where: {
      resourceTypeId_rateTier_durationMinutes: {
        resourceTypeId: resourceType.id,
        rateTier,
        durationMinutes: isCourt ? 60 : durationMinutes,
      },
    },
  })
  if (!pricingRule) {
    return Response.json(
      { error: 'No pricing available for this resource, rate tier, and duration' },
      { status: 400 },
    )
  }

  const isNonMemberCourt = isCourt && rateTier === 'non_member'
  if (guestCount > 0 && !isNonMemberCourt) {
    return Response.json(
      { error: 'guestCount only applies to non-member court bookings' },
      { status: 400 },
    )
  }

  let guestFeeCentavos = 0
  if (guestCount > 0) {
    const guestFeeRule = await prisma.guestFeeRule.findFirst()
    if (!guestFeeRule) {
      console.error('GuestFeeRule table is empty — cannot price guest fee')
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
    guestFeeCentavos = guestCount * guestFeeRule.amountCentavos
  }

  const baseAmountCentavos = isCourt
    ? pricingRule.priceCentavos * (durationMinutes / 60)
    : pricingRule.priceCentavos
  const totalAmountCentavos = baseAmountCentavos + guestFeeCentavos

  type SelectedAddOn = {
    service: 'ball_boy' | 'coaching_fee'
    addOnServiceId: string
    addOnPricingRuleId: string
    paxCount: number | null
    amountCentavos: number
  }
  const selectedAddOns: SelectedAddOn[] = []

  if (ballBoy) {
    const ballBoyService = await prisma.addOnService.findUnique({ where: { slug: 'ball_boy' } })
    // Prisma's compound-unique input rejects null for a nullable field at runtime
    // (known Prisma limitation), so this can't use findUnique on the compound key.
    const ballBoyRule = ballBoyService
      ? await prisma.addOnPricingRule.findFirst({
          where: {
            addOnServiceId: ballBoyService.id,
            resourceTypeId: resourceType.id,
            rateTier,
            paxCount: null,
          },
        })
      : null
    if (!ballBoyService || !ballBoyRule) {
      return Response.json(
        { error: 'Ball boy not available for this resource and rate tier' },
        { status: 400 },
      )
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
            resourceTypeId: resourceType.id,
            rateTier,
            paxCount: coachingPaxCount,
          },
        })
      : null
    if (!coachingService || !coachingRule) {
      return Response.json(
        { error: 'Coaching not available for this resource and rate tier' },
        { status: 400 },
      )
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

  let booking
  let checkoutSessionIdsToExpire: string[] = []
  try {
    booking = await prisma.$transaction(async (tx) => {
      const holdCutoff = new Date(Date.now() - HOLD_MINUTES * 60000)
      const staleBookings = await tx.booking.findMany({
        where: {
          resourceId: resource.id,
          status: 'pending_payment',
          createdAt: { lt: holdCutoff },
          startTime: { lt: endTime },
          endTime: { gt: parsedStartTime },
        },
        include: { payment: true },
      })

      if (staleBookings.length > 0) {
        const staleBookingIds = staleBookings.map((b) => b.id)
        await tx.booking.updateMany({
          where: { id: { in: staleBookingIds } },
          data: { status: 'cancelled' },
        })
        await tx.payment.updateMany({
          where: { bookingId: { in: staleBookingIds } },
          data: { status: 'failed' },
        })
        checkoutSessionIdsToExpire = staleBookings
          .filter((b) => b.payment?.status === 'pending' && b.payment.paymongoCheckoutSessionId != null)
          .map((b) => b.payment!.paymongoCheckoutSessionId!)
      }

      const createdBooking = await tx.booking.create({
        data: {
          customerId: customerRecord.id,
          resourceId: resource.id,
          startTime: parsedStartTime,
          endTime,
          status: 'pending_payment',
          guestCount,
          totalAmountCentavos,
        },
      })

      if (selectedAddOns.length > 0) {
        await tx.bookingAddOn.createMany({
          data: selectedAddOns.map((addOn) => ({
            bookingId: createdBooking.id,
            addOnServiceId: addOn.addOnServiceId,
            addOnPricingRuleId: addOn.addOnPricingRuleId,
            quantity: 1,
            amountCentavos: addOn.amountCentavos,
          })),
        })
      }

      return createdBooking
    })
  } catch (err) {
    console.error('Booking creation failed', err)
    if (isExclusionViolation(err)) {
      return Response.json({ error: 'Slot unavailable' }, { status: 409 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  for (const checkoutSessionId of checkoutSessionIdsToExpire) {
    await expirePaymongoCheckoutSession(checkoutSessionId)
  }

  const holdExpiresAt = new Date(booking.createdAt.getTime() + HOLD_MINUTES * 60000)

  return Response.json(
    {
      id: booking.id,
      status: booking.status,
      resourceId: booking.resourceId,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmountCentavos: booking.totalAmountCentavos,
      holdExpiresAt,
      addOns: selectedAddOns.map((addOn) => ({
        service: addOn.service,
        paxCount: addOn.paxCount,
        amountCentavos: addOn.amountCentavos,
      })),
      addOnsTotalCentavos,
    },
    { status: 201 },
  )
}
