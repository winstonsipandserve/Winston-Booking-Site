import { prisma } from '@/lib/prisma'
import { formatMembershipTier } from '@/lib/format'
import { createPaymongoCheckoutSession, retrievePaymongoCheckoutSession } from '@/lib/paymongo'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

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
