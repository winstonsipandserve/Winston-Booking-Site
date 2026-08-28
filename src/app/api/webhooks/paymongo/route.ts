import { prisma } from '@/lib/prisma'
import { verifyPaymongoWebhookSignature } from '@/lib/paymongo'
import { sendBookingConfirmationEmail, sendActivationEmail, sendMembershipRenewalEmail } from '@/lib/resend'
import { MEMBERSHIP_TIER_PLANS, computeMembershipEndDate } from '@/lib/membership-pricing'
import { formatMembershipTier } from '@/lib/format'
import { generateActivationToken } from '@/lib/member-activation'

const ADD_ON_EMAIL_LABELS: Record<string, string> = {
  ball_boy: 'Ball Boy',
  coaching_fee: 'Coaching',
}

interface PaymongoWebhookEvent {
  data?: {
    attributes?: {
      type?: string
      data?: {
        attributes?: {
          status?: unknown
          payment_intent_id?: unknown
          paid_at?: unknown
          metadata?: { bookingId?: unknown; membershipPaymentId?: unknown }
        }
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
  if (eventType !== 'payment.paid') {
    return Response.json({ received: true }, { status: 200 })
  }

  const paymentAttributes = event?.data?.attributes?.data?.attributes
  const bookingId = paymentAttributes?.metadata?.bookingId
  const membershipPaymentId = paymentAttributes?.metadata?.membershipPaymentId
  const paymentStatus = paymentAttributes?.status
  const paymentIntentIdRaw = paymentAttributes?.payment_intent_id
  const paymentIntentId = isNonEmptyString(paymentIntentIdRaw) ? paymentIntentIdRaw : null
  const paidAtRaw = paymentAttributes?.paid_at
  const paidAt = typeof paidAtRaw === 'number' ? new Date(paidAtRaw * 1000) : new Date()

  if (paymentStatus !== 'paid') {
    console.error('Webhook type payment.paid but nested payment status is not paid', bookingId, paymentStatus)
    return Response.json({ received: true }, { status: 200 })
  }

  if (isNonEmptyString(membershipPaymentId) && !isNonEmptyString(bookingId)) {
    return handleMembershipPaymentWebhook(membershipPaymentId, paymentIntentId, paidAt)
  }

  if (!isNonEmptyString(bookingId)) {
    console.error('Webhook payload metadata has neither bookingId nor membershipPaymentId', paymentAttributes?.metadata)
    return Response.json({ received: true }, { status: 200 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      customer: true,
      resource: { include: { resourceType: true } },
      addOns: { include: { addOnService: true, addOnPricingRule: true } },
    },
    relationLoadStrategy: 'query',
  })

  if (!booking) {
    console.error('Webhook received for unknown bookingId', bookingId)
    return Response.json({ received: true }, { status: 200 })
  }

  if (booking.payment?.status === 'paid') {
    return Response.json({ received: true }, { status: 200 })
  }

  let bookingConfirmed = false

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { bookingId: booking.id },
        data: {
          status: 'paid',
          paidAt,
          paymongoPaymentIntentId: paymentIntentId,
        },
      })

      if (booking.status === 'pending_payment') {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'confirmed' },
        })
        bookingConfirmed = true
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

  if (bookingConfirmed) {
    if (!booking.customer) {
      console.error(`Booking confirmed but no customer attached — skipping confirmation email: bookingId=${booking.id}`)
    } else {
      const addOnsTotalCentavos = booking.addOns.reduce((sum, addOn) => sum + addOn.amountCentavos, 0)
      const totalPaidCentavos = booking.totalAmountCentavos + addOnsTotalCentavos

      let guestFeeCentavos = 0
      if (booking.guestCount > 0) {
        const guestFeeRule = await prisma.guestFeeRule.findFirst()
        if (!guestFeeRule) {
          console.error('GuestFeeRule table is empty — cannot compute guest fee for confirmation email', booking.id)
        } else {
          guestFeeCentavos = booking.guestCount * guestFeeRule.amountCentavos
        }
      }

      const addOns = booking.addOns.map((addOn) => {
        const label = ADD_ON_EMAIL_LABELS[addOn.addOnService.slug] ?? addOn.addOnService.slug
        const paxSuffix = addOn.addOnPricingRule.paxCount !== null ? ` (${addOn.addOnPricingRule.paxCount} pax)` : ''
        return { name: `${label}${paxSuffix}`, amountCentavos: addOn.amountCentavos }
      })

      await sendBookingConfirmationEmail({
        to: booking.customer.email,
        name: booking.customer.name,
        bookingReference: booking.id,
        resourceTypeName: booking.resource.resourceType.name,
        resourceLabel: booking.resource.label,
        startTime: booking.startTime,
        endTime: booking.endTime,
        guestCount: booking.guestCount,
        guestFeeCentavos,
        addOns,
        totalPaidCentavos,
      })
    }
  }

  return Response.json({ received: true }, { status: 200 })
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

async function handleMembershipPaymentWebhook(
  membershipPaymentId: string,
  paymentIntentId: string | null,
  paidAt: Date,
): Promise<Response> {
  const membershipPayment = await prisma.membershipPayment.findUnique({
    where: { id: membershipPaymentId },
    include: { customer: true },
    relationLoadStrategy: 'query',
  })

  if (!membershipPayment) {
    console.error('Webhook received for unknown membershipPaymentId', membershipPaymentId)
    return Response.json({ received: true }, { status: 200 })
  }

  if (membershipPayment.status === 'paid') {
    return Response.json({ received: true }, { status: 200 })
  }

  const isRenewal = membershipPayment.applicationId === null
  const plan = MEMBERSHIP_TIER_PLANS[membershipPayment.tier]
  const startDate = paidAt
  const endDate = computeMembershipEndDate(startDate, membershipPayment.tier)

  try {
    await prisma.$transaction(async (tx) => {
      await tx.membershipPayment.update({
        where: { id: membershipPayment.id },
        data: {
          status: 'paid',
          paidAt,
          paymongoPaymentIntentId: paymentIntentId,
        },
      })

      const membership = await tx.membership.create({
        data: {
          customerId: membershipPayment.customerId,
          applicationId: membershipPayment.applicationId,
          tier: membershipPayment.tier,
          status: 'active',
          startDate,
          endDate,
          activationFeeCentavos: plan.activationFeeCentavos,
          creditBalanceCentavos: plan.creditCentavos,
        },
      })

      await tx.membershipCreditTransaction.create({
        data: {
          membershipId: membership.id,
          amountCentavos: plan.creditCentavos,
          reason: isRenewal ? 'renewal' : 'activation',
        },
      })
    })
  } catch (err) {
    console.error('Failed to process PayMongo membership payment webhook', membershipPaymentId, err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  if (isRenewal) {
    const expiryDateLabel = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Manila',
    }).format(endDate)

    await sendMembershipRenewalEmail({
      to: membershipPayment.customer.email,
      name: membershipPayment.customer.name,
      tierName: formatMembershipTier(membershipPayment.tier),
      amountPaidCentavos: plan.totalCentavos,
      activationFeeCentavos: plan.activationFeeCentavos,
      creditBalanceCentavos: plan.creditCentavos,
      expiryDateLabel,
    })
  } else if (!membershipPayment.customer.passwordHash) {
    const { rawToken, tokenHash, expiresAt } = generateActivationToken()
    await prisma.memberActivationToken.create({
      data: { customerId: membershipPayment.customerId, tokenHash, expiresAt },
    })
    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/activate?token=${rawToken}`
    await sendActivationEmail({
      to: membershipPayment.customer.email,
      name: membershipPayment.customer.name,
      activationUrl,
      tierName: formatMembershipTier(membershipPayment.tier),
      amountPaidCentavos: plan.totalCentavos,
      activationFeeCentavos: plan.activationFeeCentavos,
      creditBalanceCentavos: plan.creditCentavos,
    })
  }

  return Response.json({ received: true }, { status: 200 })
}
