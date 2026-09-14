import { prisma } from '@/lib/prisma'
import { formatMembershipTier } from '@/lib/format'
import { createPaymongoCheckoutSession, retrievePaymongoCheckoutSession } from '@/lib/paymongo'
import { lookupRenewalPaymentLinkToken } from '@/lib/membership-payment-link'

interface CheckoutRequestBody {
  token?: unknown
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: CheckoutRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { token } = body
  if (typeof token !== 'string' || token.length === 0) {
    return Response.json({ error: 'A token is required' }, { status: 400 })
  }

  const membershipPayment = await prisma.membershipPayment.findUnique({
    where: { id },
    include: { customer: true },
  })
  if (!membershipPayment) {
    return Response.json({ error: 'Payment not found' }, { status: 404 })
  }

  if (membershipPayment.status === 'paid') {
    return Response.json({ error: 'This renewal has already been paid' }, { status: 409 })
  }

  if (membershipPayment.applicationId !== null) {
    return Response.json({ error: 'This renewal link is no longer valid' }, { status: 409 })
  }

  const tokenResult = await lookupRenewalPaymentLinkToken(membershipPayment.id, token)
  if (!tokenResult.ok) {
    return Response.json({ error: tokenResult.error }, { status: tokenResult.status })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const tierName = formatMembershipTier(membershipPayment.tier)

  if (membershipPayment.paymongoCheckoutSessionId) {
    try {
      const session = await retrievePaymongoCheckoutSession(membershipPayment.paymongoCheckoutSessionId)
      return Response.json({ checkoutUrl: session.checkoutUrl }, { status: 200 })
    } catch (err) {
      console.error('Failed to retrieve existing PayMongo checkout session', membershipPayment.id, err)
      return Response.json({ error: 'Unable to resume checkout for this renewal' }, { status: 502 })
    }
  }

  let session
  try {
    session = await createPaymongoCheckoutSession({
      lineItems: [
        {
          name: `${tierName} Membership Renewal`,
          amount: membershipPayment.amountCentavos,
          currency: 'PHP',
          quantity: 1,
        },
      ],
      successUrl: `${appUrl}/account/renew/confirmation?membershipPaymentId=${membershipPayment.id}`,
      cancelUrl: `${appUrl}/membership/renew/${membershipPayment.id}`,
      referenceNumber: membershipPayment.id,
      metadata: { membershipPaymentId: membershipPayment.id },
      billing: {
        name: membershipPayment.customer.name,
        email: membershipPayment.customer.email,
        phone: membershipPayment.customer.phone,
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
    data: { paymongoCheckoutSessionId: session.id },
  })

  return Response.json({ checkoutUrl: session.checkoutUrl }, { status: 200 })
}
