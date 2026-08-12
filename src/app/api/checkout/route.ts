import { prisma } from '@/lib/prisma'
import { HOLD_MINUTES } from '@/lib/booking-hold'
import { createPaymongoCheckoutSession, retrievePaymongoCheckoutSession } from '@/lib/paymongo'

interface CheckoutRequestBody {
  bookingId?: unknown
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function formatAddOnName(serviceName: string, paxCount: number | null): string {
  return paxCount != null ? `${serviceName} (${paxCount} pax)` : serviceName
}

export async function POST(request: Request) {
  let body: CheckoutRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { bookingId } = body
  if (!isNonEmptyString(bookingId)) {
    return Response.json({ error: 'bookingId is required' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
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

  if (booking.payment) {
    if (!booking.payment.paymongoCheckoutSessionId) {
      console.error('Booking payment exists with no paymongoCheckoutSessionId', booking.id)
      return Response.json({ error: 'Unable to resume checkout for this booking' }, { status: 502 })
    }
    try {
      const session = await retrievePaymongoCheckoutSession(booking.payment.paymongoCheckoutSessionId)
      return Response.json({ checkoutUrl: session.checkoutUrl }, { status: 200 })
    } catch (err) {
      console.error('Failed to retrieve existing PayMongo checkout session', booking.id, err)
      return Response.json({ error: 'Unable to resume checkout for this booking' }, { status: 502 })
    }
  }

  const holdAgeMs = Date.now() - booking.createdAt.getTime()
  if (booking.status !== 'pending_payment' || holdAgeMs > HOLD_MINUTES * 60000) {
    return Response.json(
      { error: 'Booking hold has expired or booking is no longer payable' },
      { status: 409 },
    )
  }

  const totalCentavos =
    booking.totalAmountCentavos + booking.addOns.reduce((sum, a) => sum + a.amountCentavos, 0)

  const durationMinutes = Math.round(
    (booking.endTime.getTime() - booking.startTime.getTime()) / 60000,
  )

  const lineItems = [
    {
      name: `${booking.resource.resourceType.name} — ${booking.resource.label} (${durationMinutes} min)`,
      amount: booking.totalAmountCentavos,
      currency: 'PHP' as const,
      quantity: 1,
    },
    ...booking.addOns.map((addOn) => ({
      name: formatAddOnName(addOn.addOnService.name, addOn.addOnPricingRule.paxCount),
      amount: addOn.amountCentavos,
      currency: 'PHP' as const,
      quantity: 1,
    })),
  ]

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  let session
  try {
    session = await createPaymongoCheckoutSession({
      lineItems,
      successUrl: `${appUrl}/book/confirmation?bookingId=${booking.id}`,
      cancelUrl: `${appUrl}/book`,
      referenceNumber: booking.id,
      metadata: { bookingId: booking.id },
      billing: {
        name: booking.customer.name,
        email: booking.customer.email,
        phone: booking.customer.phone,
      },
      description: `${booking.resource.resourceType.name} booking — ${booking.resource.label}`,
      sendEmailReceipt: true,
    })
  } catch (err) {
    console.error('Failed to create PayMongo checkout session', booking.id, err)
    return Response.json({ error: 'Unable to start checkout for this booking' }, { status: 502 })
  }

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amountCentavos: totalCentavos,
      status: 'pending',
      paymongoCheckoutSessionId: session.id,
    },
  })

  return Response.json({ checkoutUrl: session.checkoutUrl }, { status: 200 })
}
