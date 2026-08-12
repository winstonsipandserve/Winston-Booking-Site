import { prisma } from '@/lib/prisma'
import { HOLD_MINUTES } from '@/lib/booking-hold'
import { resolveCustomer } from '@/lib/customer-resolution'
import { priceBooking } from '@/lib/booking-pricing'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      resource: { include: { resourceType: true } },
      customer: true,
      addOns: { include: { addOnService: true, addOnPricingRule: true } },
      payment: true,
    },
  })

  if (!booking) {
    return Response.json({ error: 'Booking not found' }, { status: 404 })
  }

  const addOnsTotalCentavos = booking.addOns.reduce((sum, a) => sum + a.amountCentavos, 0)

  return Response.json(
    {
      id: booking.id,
      status: booking.status,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmountCentavos: booking.totalAmountCentavos,
      addOns: booking.addOns.map((addOn) => ({
        service: addOn.addOnService.slug,
        paxCount: addOn.addOnPricingRule.paxCount,
        amountCentavos: addOn.amountCentavos,
      })),
      addOnsTotalCentavos,
      resource: {
        typeName: booking.resource.resourceType.name,
        label: booking.resource.label,
      },
      guestCount: booking.guestCount,
      customer: booking.customer ? { name: booking.customer.name } : null,
      payment: booking.payment
        ? {
            status: booking.payment.status,
            amountCentavos: booking.payment.amountCentavos,
            paidAt: booking.payment.paidAt,
          }
        : null,
    },
    { status: 200 },
  )
}

interface AttachCustomerRequestBody {
  name?: unknown
  phone?: unknown
  email?: unknown
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: AttachCustomerRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { name, phone, email } = body
  if (!isNonEmptyString(name) || !isNonEmptyString(phone) || !isNonEmptyString(email)) {
    return Response.json({ error: 'Missing or malformed required fields' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      resource: { include: { resourceType: true } },
      addOns: { include: { addOnService: true, addOnPricingRule: true } },
    },
  })

  if (!booking) {
    return Response.json({ error: 'Booking not found' }, { status: 404 })
  }

  const holdAgeMs = Date.now() - booking.createdAt.getTime()
  if (booking.status !== 'pending_payment' || holdAgeMs > HOLD_MINUTES * 60000) {
    return Response.json(
      { error: 'Booking hold has expired or booking is no longer payable' },
      { status: 409 },
    )
  }

  const { customer, isMember } = await resolveCustomer({ name, phone, email })

  const durationMinutes = Math.round(
    (booking.endTime.getTime() - booking.startTime.getTime()) / 60000,
  )
  const ballBoyAddOn = booking.addOns.find((a) => a.addOnService.slug === 'ball_boy')
  const coachingAddOn = booking.addOns.find((a) => a.addOnService.slug === 'coaching_fee')

  const priceResult = await priceBooking({
    resourceTypeId: booking.resource.resourceType.id,
    category: booking.resource.resourceType.category,
    durationMinutes,
    guestCount: booking.guestCount,
    ballBoy: !!ballBoyAddOn,
    coaching: !!coachingAddOn,
    coachingPaxCount: coachingAddOn?.addOnPricingRule.paxCount ?? null,
    isMember,
  })
  if ('error' in priceResult) {
    return Response.json({ error: priceResult.error }, { status: priceResult.status })
  }
  const { totalAmountCentavos, addOns: repricedAddOns, addOnsTotalCentavos } = priceResult

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        customerId: customer.id,
        ...(totalAmountCentavos !== booking.totalAmountCentavos ? { totalAmountCentavos } : {}),
      },
    })

    for (const repriced of repricedAddOns) {
      const existing = booking.addOns.find((a) => a.addOnService.slug === repriced.service)
      if (existing && existing.amountCentavos !== repriced.amountCentavos) {
        await tx.bookingAddOn.update({
          where: { id: existing.id },
          data: { amountCentavos: repriced.amountCentavos },
        })
      }
    }
  })

  return Response.json({ totalAmountCentavos, addOnsTotalCentavos, isMember }, { status: 200 })
}
