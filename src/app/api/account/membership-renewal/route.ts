import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { formatMembershipTier } from '@/lib/format'
import { createPaymongoCheckoutSession, retrievePaymongoCheckoutSession } from '@/lib/paymongo'
import type { MembershipTier } from '@prisma/client'

interface MembershipRenewalRequestBody {
  tier?: unknown
}

function isMembershipTier(value: unknown): value is MembershipTier {
  return typeof value === 'string' && value in MEMBERSHIP_TIER_PLANS
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'member') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: MembershipRenewalRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { tier } = body
  if (!isMembershipTier(tier)) {
    return Response.json({ error: 'A valid tier is required' }, { status: 400 })
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.user.id } })
  if (!customer) {
    return Response.json({ error: 'Customer not found' }, { status: 404 })
  }

  const activeMembership = await prisma.membership.findFirst({
    where: { customerId: customer.id, status: 'active', endDate: { gte: new Date() } },
  })
  if (activeMembership) {
    return Response.json({ error: 'You already have an active membership' }, { status: 409 })
  }

  const existingPending = await prisma.membershipPayment.findFirst({
    where: { customerId: customer.id, applicationId: null, status: 'pending' },
    orderBy: { createdAt: 'desc' },
  })

  if (existingPending) {
    if (!existingPending.paymongoCheckoutSessionId) {
      console.error('MembershipPayment exists with no paymongoCheckoutSessionId', existingPending.id)
      return Response.json({ error: 'Unable to resume checkout for this renewal' }, { status: 502 })
    }
    try {
      const checkoutSession = await retrievePaymongoCheckoutSession(existingPending.paymongoCheckoutSessionId)
      return Response.json({ checkoutUrl: checkoutSession.checkoutUrl }, { status: 200 })
    } catch (err) {
      console.error('Failed to retrieve existing PayMongo checkout session', existingPending.id, err)
      return Response.json({ error: 'Unable to resume checkout for this renewal' }, { status: 502 })
    }
  }

  const plan = MEMBERSHIP_TIER_PLANS[tier]
  const tierName = formatMembershipTier(tier)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const membershipPayment = await prisma.membershipPayment.create({
    data: {
      customerId: customer.id,
      applicationId: null,
      tier,
      amountCentavos: plan.totalCentavos,
      status: 'pending',
    },
  })

  let checkoutSession
  try {
    checkoutSession = await createPaymongoCheckoutSession({
      lineItems: [
        {
          name: `${tierName} Membership Renewal`,
          amount: plan.totalCentavos,
          currency: 'PHP',
          quantity: 1,
        },
      ],
      successUrl: `${appUrl}/account/renew/confirmation?membershipPaymentId=${membershipPayment.id}`,
      cancelUrl: `${appUrl}/account/renew`,
      referenceNumber: membershipPayment.id,
      metadata: { membershipPaymentId: membershipPayment.id },
      billing: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      description: `${tierName} membership renewal`,
      sendEmailReceipt: true,
    })
  } catch (err) {
    console.error('Failed to create PayMongo checkout session', membershipPayment.id, err)
    return Response.json({ error: 'Unable to start checkout for this renewal' }, { status: 502 })
  }

  await prisma.membershipPayment.update({
    where: { id: membershipPayment.id },
    data: { paymongoCheckoutSessionId: checkoutSession.id },
  })

  return Response.json({ checkoutUrl: checkoutSession.checkoutUrl }, { status: 200 })
}
