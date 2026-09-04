import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { formatMembershipTier } from '@/lib/format'
import { getLatestMembershipByCustomerId } from '@/lib/membership-latest'
import { sendRenewalPaymentLinkEmail } from '@/lib/resend'
import type { MembershipTier } from '@prisma/client'

interface SendRenewalLinkRequestBody {
  tier?: unknown
}

function isMembershipTier(value: unknown): value is MembershipTier {
  return typeof value === 'string' && value in MEMBERSHIP_TIER_PLANS
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: SendRenewalLinkRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { tier } = body
  if (!isMembershipTier(tier)) {
    return Response.json({ error: 'A valid tier is required' }, { status: 400 })
  }

  const application = await prisma.membershipApplication.findUnique({
    where: { id },
    include: { customer: true },
  })
  if (!application) {
    return Response.json({ error: 'Membership application not found' }, { status: 404 })
  }

  const latestMembership = await getLatestMembershipByCustomerId(application.customerId)
  if (!latestMembership || latestMembership.endDate >= new Date()) {
    return Response.json({ error: "This customer's membership is not expired" }, { status: 409 })
  }

  const existingPending = await prisma.membershipPayment.findFirst({
    where: { customerId: application.customerId, applicationId: null, status: 'pending' },
    orderBy: { createdAt: 'desc' },
  })

  const membershipPayment = existingPending
    ? existingPending
    : await prisma.membershipPayment.create({
        data: {
          customerId: application.customerId,
          applicationId: null,
          tier,
          amountCentavos: MEMBERSHIP_TIER_PLANS[tier].totalCentavos,
          status: 'pending',
          initiatedByAdminId: activeSession.adminUser.id,
        },
      })

  const tierName = formatMembershipTier(membershipPayment.tier)
  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/membership/renew/${membershipPayment.id}`
  await sendRenewalPaymentLinkEmail({
    to: application.customer.email,
    name: application.customer.name,
    tierName,
    amountCentavos: membershipPayment.amountCentavos,
    paymentUrl,
  })

  return Response.json(
    { membershipPaymentId: membershipPayment.id, tierName, resent: existingPending !== null },
    { status: 200 },
  )
}
