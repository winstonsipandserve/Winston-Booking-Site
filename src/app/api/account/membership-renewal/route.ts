import { getActiveMemberSession } from '@/lib/member-session'
import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIER_PLANS, formatMembershipPlanLabel } from '@/lib/membership-pricing'
import { quoteMembershipPrice, withFoundingSeatLock } from '@/lib/membership-founding'
import { getRenewalEligibility } from '@/lib/membership-current'
import { createPaymongoCheckoutSession, retrievePaymongoCheckoutSession } from '@/lib/paymongo'
import type { MembershipTier } from '@prisma/client'

interface MembershipRenewalRequestBody {
  tier?: unknown
}

function isMembershipTier(value: unknown): value is MembershipTier {
  return typeof value === 'string' && value in MEMBERSHIP_TIER_PLANS
}

export async function POST(request: Request) {
  const memberSession = await getActiveMemberSession()
  if (!memberSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { customer } = memberSession

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

  const renewal = await getRenewalEligibility(customer.id)
  if (!renewal.eligible) {
    return Response.json(
      {
        error:
          renewal.reason === 'already_scheduled'
            ? 'Your renewal is already paid and scheduled'
            : 'You already have an active membership',
      },
      { status: 409 },
    )
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  // Priced under the Founding seat lock (src/lib/membership-founding.ts): a Founding Member
  // renewing into Premier pays the standard price but keeps the Founding flag; anyone else
  // may still take a free seat at the discounted price.
  const membershipPayment = await withFoundingSeatLock(async (tx) => {
    const quote = await quoteMembershipPrice(tx, customer.id, tier)
    return tx.membershipPayment.create({
      data: {
        customerId: customer.id,
        applicationId: null,
        tier,
        amountCentavos: quote.amountCentavos,
        isFounding: quote.isFounding,
        status: 'pending',
      },
    })
  })
  const tierName = formatMembershipPlanLabel(tier, membershipPayment.isFounding)

  let checkoutSession
  try {
    checkoutSession = await createPaymongoCheckoutSession({
      lineItems: [
        {
          name: `${tierName} Membership Renewal`,
          amount: membershipPayment.amountCentavos,
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
