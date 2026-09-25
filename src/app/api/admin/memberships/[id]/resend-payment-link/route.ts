import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { generatePaymentLinkToken } from '@/lib/membership-payment-link'
import { formatMembershipPlanLabel } from '@/lib/membership-pricing'
import { quoteMembershipPrice } from '@/lib/membership-founding'
import { sendMembershipPaymentEmail } from '@/lib/resend'
import { logAdminActivity } from '@/lib/admin-activity-log'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const application = await prisma.membershipApplication.findUnique({
    where: { id },
    include: { customer: true, membership: true },
  })
  if (!application) {
    return Response.json({ error: 'Membership application not found' }, { status: 404 })
  }

  if (application.membership) {
    return Response.json(
      { error: 'This application already has an active membership' },
      { status: 409 },
    )
  }
  if (application.status !== 'approved') {
    return Response.json({ error: 'This application is not awaiting payment' }, { status: 409 })
  }

  const { rawToken, tokenHash, expiresAt } = generatePaymentLinkToken()

  // A newly issued link supersedes every earlier link, mirroring the same precaution the
  // activation-resend flow takes with its tokens.
  await prisma.$transaction(async (tx) => {
    const now = new Date()
    await tx.membershipPaymentLinkToken.updateMany({
      where: { applicationId: application.id, usedAt: null },
      data: { usedAt: now },
    })
    await tx.membershipPaymentLinkToken.create({
      data: { applicationId: application.id, tokenHash, expiresAt },
    })
  })

  await logAdminActivity({
    adminId: activeSession.adminUser.id,
    action: 'membership_payment_link_resent',
    entityType: 'membership_application',
    entityId: application.id,
    description: `Resent payment link to ${application.customer.name}`,
    metadata: { customerId: application.customerId },
  })

  // A quote, not a reservation: the seat is taken only when checkout creates the payment row.
  const quote = await quoteMembershipPrice(prisma, application.customerId, application.requestedTier)
  const tierName = formatMembershipPlanLabel(application.requestedTier, quote.isFounding)
  const amountCentavos = quote.amountCentavos
  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/membership/pay/${application.id}?token=${rawToken}`
  const paymentEmailSent = await sendMembershipPaymentEmail({
    to: application.customer.email,
    name: application.customer.name,
    tierName,
    amountCentavos,
    paymentUrl,
  })

  return Response.json({ success: true, paymentEmailSent }, { status: 200 })
}
