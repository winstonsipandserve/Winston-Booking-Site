import { Prisma, RateTier } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const HOLD_MINUTES = Number(process.env.BOOKING_HOLD_MINUTES) || 10

interface BookingRequestBody {
  resourceId?: unknown
  startTime?: unknown
  durationMinutes?: unknown
  guestCount?: unknown
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

  if (
    !isNonEmptyString(resourceId) ||
    !isNonEmptyString(startTime) ||
    typeof durationMinutes !== 'number' ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    typeof guestCountRaw !== 'number' ||
    !Number.isInteger(guestCountRaw) ||
    guestCountRaw < 0 ||
    !customer ||
    !isNonEmptyString(customer.name) ||
    !isNonEmptyString(customer.email) ||
    !isNonEmptyString(customer.phone)
  ) {
    return Response.json({ error: 'Missing or malformed required fields' }, { status: 400 })
  }

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

  if (isCourt && durationMinutes % 60 !== 0) {
    return Response.json(
      { error: 'Court bookings must be a positive multiple of 60 minutes' },
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

  const endTime = new Date(parsedStartTime.getTime() + durationMinutes * 60000)

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

  let booking
  try {
    booking = await prisma.$transaction(async (tx) => {
      const holdCutoff = new Date(Date.now() - HOLD_MINUTES * 60000)
      await tx.booking.updateMany({
        where: {
          resourceId: resource.id,
          status: 'pending_payment',
          createdAt: { lt: holdCutoff },
          startTime: { lt: endTime },
          endTime: { gt: parsedStartTime },
        },
        data: { status: 'cancelled' },
      })

      return tx.booking.create({
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
    })
  } catch (err) {
    console.error('Booking creation failed', err)
    if (isExclusionViolation(err)) {
      return Response.json({ error: 'Slot unavailable' }, { status: 409 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
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
    },
    { status: 201 },
  )
}
