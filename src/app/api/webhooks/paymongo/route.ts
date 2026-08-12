import { prisma } from '@/lib/prisma'
import { verifyPaymongoWebhookSignature } from '@/lib/paymongo'

interface PaymongoWebhookEvent {
  data?: {
    attributes?: {
      type?: string
      data?: {
        metadata?: { bookingId?: unknown }
        payment_intent?: { id?: unknown }
      }
    }
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signatureHeader = request.headers.get('Paymongo-Signature')
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET ?? ''

  if (!verifyPaymongoWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: PaymongoWebhookEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const eventType = event?.data?.attributes?.type
  if (eventType !== 'checkout_session.payment.paid') {
    return Response.json({ received: true }, { status: 200 })
  }

  const checkoutSessionData = event?.data?.attributes?.data
  const bookingId = checkoutSessionData?.metadata?.bookingId
  const paymentIntentIdRaw = checkoutSessionData?.payment_intent?.id
  const paymentIntentId = isNonEmptyString(paymentIntentIdRaw) ? paymentIntentIdRaw : null

  if (!isNonEmptyString(bookingId)) {
    return Response.json({ error: 'Missing bookingId in webhook payload metadata' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  })

  if (!booking) {
    console.error('Webhook received for unknown bookingId', bookingId)
    return Response.json({ received: true }, { status: 200 })
  }

  if (booking.payment?.status === 'paid') {
    return Response.json({ received: true }, { status: 200 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { bookingId: booking.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymongoPaymentIntentId: paymentIntentId,
        },
      })

      if (booking.status === 'pending_payment') {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'confirmed' },
        })
      } else {
        console.error(
          `PAYMENT COLLECTED FOR NON-PENDING BOOKING — manual review needed: bookingId=${booking.id} status=${booking.status}`,
        )
      }
    })
  } catch (err) {
    console.error('Failed to process PayMongo webhook', bookingId, err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json({ received: true }, { status: 200 })
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
