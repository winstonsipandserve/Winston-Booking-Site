import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'
import { getActiveMembership } from '@/lib/customer-resolution'
import { createPaymongoCheckoutSession } from '@/lib/paymongo'
import { formatCentavos } from '@/lib/format'
import { isValidTopUpPresetCentavos } from '@/lib/membership-topup'

interface MembershipTopUpRequestBody {
  amountCentavos?: unknown
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'member') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: MembershipTopUpRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { amountCentavos } = body
  if (!isValidTopUpPresetCentavos(amountCentavos)) {
    return Response.json({ error: 'A valid top-up amount is required' }, { status: 400 })
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.user.id } })
  if (!customer) {
    return Response.json({ error: 'Customer not found' }, { status: 404 })
  }

  const membership = await getActiveMembership(customer.id)
  if (!membership) {
    return Response.json({ error: 'You do not have an active membership' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const payment = await prisma.payment.create({
    data: {
      amountCentavos,
      status: 'pending',
      method: 'paymongo',
      membershipId: membership.id,
    },
  })

  let checkoutSession
  try {
    checkoutSession = await createPaymongoCheckoutSession({
      lineItems: [
        {
          name: 'Membership Credit Top-Up',
          amount: amountCentavos,
          currency: 'PHP',
          quantity: 1,
        },
      ],
      successUrl: `${appUrl}/account/topup/confirmation?topUpPaymentId=${payment.id}`,
      cancelUrl: `${appUrl}/account`,
      referenceNumber: payment.id,
      metadata: { topUpPaymentId: payment.id },
      billing: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      description: `Membership credit top-up — ${formatCentavos(amountCentavos)}`,
      sendEmailReceipt: true,
    })
  } catch (err) {
    console.error('Failed to create PayMongo checkout session', payment.id, err)
    return Response.json({ error: 'Unable to start checkout for this top-up' }, { status: 502 })
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { paymongoCheckoutSessionId: checkoutSession.id },
  })

  return Response.json({ checkoutUrl: checkoutSession.checkoutUrl }, { status: 200 })
}
