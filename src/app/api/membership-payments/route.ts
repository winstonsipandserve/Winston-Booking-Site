import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { formatMembershipTier } from '@/lib/format'
import { createPaymongoCheckoutSession, retrievePaymongoCheckoutSession } from '@/lib/paymongo'

interface MembershipPaymentRequestBody {
  applicationId?: unknown
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export async function POST(request: Request) {
  let body: MembershipPaymentRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { applicationId } = body
  if (!isNonEmptyString(applicationId)) {
    return Response.json({ error: 'applicationId is required' }, { status: 400 })
  }

  const application = await prisma.membershipApplication.findUnique({
    where: { id: applicationId },
    include: { customer: true, membership: true },
    relationLoadStrategy: 'query',
  })

  if (!application) {
    return Response.json({ error: 'Application not found' }, { status: 404 })
  }

  if (application.membership) {
    return Response.json(
      { error: 'This application already has an active membership' },
      { status: 409 },
    )
  }

  if (application.status !== 'approved') {
    return Response.json({ error: 'This application is not approved' }, { status: 409 })
  }

  const existingPending = await prisma.membershipPayment.findFirst({
    where: { applicationId: application.id, status: 'pending' },
    orderBy: { createdAt: 'desc' },
  })

  if (existingPending) {
    if (!existingPending.paymongoCheckoutSessionId) {
      console.error('MembershipPayment exists with no paymongoCheckoutSessionId', existingPending.id)
      return Response.json({ error: 'Unable to resume checkout for this application' }, { status: 502 })
    }
    try {
      const session = await retrievePaymongoCheckoutSession(existingPending.paymongoCheckoutSessionId)
      return Response.json({ checkoutUrl: session.checkoutUrl }, { status: 200 })
    } catch (err) {
      console.error('Failed to retrieve existing PayMongo checkout session', existingPending.id, err)
      return Response.json({ error: 'Unable to resume checkout for this application' }, { status: 502 })
    }
  }

  const plan = MEMBERSHIP_TIER_PLANS[application.requestedTier]
  const tierName = formatMembershipTier(application.requestedTier)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const membershipPayment = await prisma.membershipPayment.create({
    data: {
      applicationId: application.id,
      tier: application.requestedTier,
      amountCentavos: plan.totalCentavos,
      status: 'pending',
    },
  })

  let session
  try {
    session = await createPaymongoCheckoutSession({
      lineItems: [
        {
          name: `${tierName} Membership`,
          amount: plan.totalCentavos,
          currency: 'PHP',
          quantity: 1,
        },
      ],
      successUrl: `${appUrl}/membership/pay/confirmation?applicationId=${application.id}`,
      cancelUrl: `${appUrl}/membership/pay/${application.id}`,
      referenceNumber: membershipPayment.id,
      metadata: { membershipPaymentId: membershipPayment.id },
      billing: {
        name: application.customer.name,
        email: application.customer.email,
        phone: application.customer.phone,
      },
      description: `${tierName} membership activation`,
      sendEmailReceipt: true,
    })
  } catch (err) {
    console.error('Failed to create PayMongo checkout session', membershipPayment.id, err)
    return Response.json({ error: 'Unable to start checkout for this application' }, { status: 502 })
  }

  await prisma.membershipPayment.update({
    where: { id: membershipPayment.id },
    data: { paymongoCheckoutSessionId: session.id },
  })

  return Response.json({ checkoutUrl: session.checkoutUrl }, { status: 200 })
}
