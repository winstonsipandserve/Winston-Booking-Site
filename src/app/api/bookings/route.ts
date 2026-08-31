import { Booking, Membership, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { HOLD_MINUTES } from '@/lib/booking-hold'
import { isWithinBusinessHours } from '@/lib/business-hours'
import { expirePaymongoCheckoutSession } from '@/lib/paymongo'
import { priceBooking } from '@/lib/booking-pricing'
import { getActiveMembership } from '@/lib/customer-resolution'
import { sendBookingConfirmationEmailForBooking } from '@/lib/booking-confirmation'
import { auth } from '../../../../auth'

interface BookingRequestBody {
  resourceId?: unknown
  startTime?: unknown
  durationMinutes?: unknown
  guestCount?: unknown
  ballBoy?: unknown
  coaching?: unknown
  coachingPaxCount?: unknown
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
  const session = await auth()
  const isMemberSession = !!session?.user?.id && session.user.role === 'member'

  let body: BookingRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { resourceId, startTime, durationMinutes } = body
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
    typeof coachingRaw !== 'boolean'
  ) {
    return Response.json({ error: 'Missing or malformed required fields' }, { status: 400 })
  }

  const ballBoy = ballBoyRaw
  const coaching = coachingRaw

  const parsedStartTime = new Date(startTime)
  if (Number.isNaN(parsedStartTime.getTime())) {
    return Response.json({ error: 'startTime must be a valid ISO 8601 date' }, { status: 400 })
  }

  let customerId: string | null = null
  let isMember = false
  let activeMembership: Membership | null = null
  if (isMemberSession) {
    customerId = session!.user.id
    activeMembership = await getActiveMembership(customerId)
    isMember = !!activeMembership
  }

  const guestCount = isMember ? 0 : guestCountRaw

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: { resourceType: true },
    relationLoadStrategy: 'query',
  })
  if (!resource || !resource.isActive) {
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

  const priceResult = await priceBooking({
    resourceTypeId: resourceType.id,
    category: resourceType.category,
    durationMinutes,
    guestCount,
    ballBoy,
    coaching,
    coachingPaxCount,
    isMember,
  })
  if ('error' in priceResult) {
    return Response.json({ error: priceResult.error }, { status: priceResult.status })
  }
  const { totalAmountCentavos, addOns: selectedAddOns, addOnsTotalCentavos } = priceResult
  const grandTotalCentavos = totalAmountCentavos + addOnsTotalCentavos

  let checkoutSessionIdsToExpire: string[] = []
  let txResult: { booking: Booking; creditCovered: boolean }
  try {
    txResult = await prisma.$transaction(async (tx) => {
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
        relationLoadStrategy: 'query',
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

      // If this is a member booking and their credit balance fully covers the grand
      // total, atomically decrement it and confirm the booking immediately — no
      // PayMongo checkout needed. The `gte` filter inside updateMany (not a separate
      // findUnique-then-update) is what makes this concurrency-safe: if two bookings
      // race for the same balance, only one update can match once the first has
      // already decremented it below the threshold.
      let creditCovered = false
      if (
        isMember &&
        activeMembership &&
        activeMembership.creditBalanceCentavos >= grandTotalCentavos
      ) {
        const decrement = await tx.membership.updateMany({
          where: { id: activeMembership.id, creditBalanceCentavos: { gte: grandTotalCentavos } },
          data: { creditBalanceCentavos: { decrement: grandTotalCentavos } },
        })
        creditCovered = decrement.count === 1
      }

      const createdBooking = await tx.booking.create({
        data: {
          customerId,
          resourceId: resource.id,
          startTime: parsedStartTime,
          endTime,
          status: creditCovered ? 'confirmed' : 'pending_payment',
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

      if (creditCovered && activeMembership) {
        await tx.payment.create({
          data: {
            bookingId: createdBooking.id,
            amountCentavos: grandTotalCentavos,
            status: 'paid',
            method: 'membership_credit',
            paidAt: new Date(),
          },
        })
        await tx.membershipCreditTransaction.create({
          data: {
            membershipId: activeMembership.id,
            bookingId: createdBooking.id,
            amountCentavos: -grandTotalCentavos,
            reason: 'booking_redemption',
          },
        })
      }

      return { booking: createdBooking, creditCovered }
    })
  } catch (err) {
    console.error('Booking creation failed', err)
    if (isExclusionViolation(err)) {
      return Response.json({ error: 'Slot unavailable' }, { status: 409 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  const { booking, creditCovered } = txResult

  for (const checkoutSessionId of checkoutSessionIdsToExpire) {
    await expirePaymongoCheckoutSession(checkoutSessionId)
  }

  if (creditCovered && activeMembership) {
    await sendBookingConfirmationEmailForBooking(booking.id, {
      amountCentavos: grandTotalCentavos,
      remainingBalanceCentavos: activeMembership.creditBalanceCentavos - grandTotalCentavos,
    })
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
      customerAttached: isMemberSession,
      isMember,
      creditCovered,
    },
    { status: 201 },
  )
}
