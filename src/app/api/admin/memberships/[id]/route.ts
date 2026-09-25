import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { formatMembershipPlanLabel } from '@/lib/membership-pricing'
import { quoteMembershipPrice } from '@/lib/membership-founding'
import { formatMembershipTier } from '@/lib/format'
import { sendMembershipPaymentEmail, sendRejectionEmail } from '@/lib/resend'
import { logAdminActivity } from '@/lib/admin-activity-log'
import { generatePaymentLinkToken } from '@/lib/membership-payment-link'

interface ReviewRequestBody {
  action?: unknown
  reason?: unknown
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: ReviewRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { action, reason } = body
  if (action !== 'approve' && action !== 'reject') {
    return Response.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 })
  }
  if (action === 'reject' && !(typeof reason === 'string' && reason.trim().length > 0)) {
    return Response.json({ error: 'A rejection reason is required' }, { status: 400 })
  }

  const application = await prisma.membershipApplication.findUnique({
    where: { id },
    include: { customer: true },
  })
  if (!application) {
    return Response.json({ error: 'Membership application not found' }, { status: 404 })
  }
  if (application.status !== 'pending') {
    return Response.json({ error: 'This application has already been reviewed' }, { status: 409 })
  }

  const reviewedAt = new Date()

  if (action === 'reject') {
    const trimmedReason = (reason as string).trim()
    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.membershipApplication.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectionReason: trimmedReason,
          reviewedById: activeSession.adminUser.id,
          reviewedAt,
        },
      })
      await logAdminActivity(
        {
          adminId: activeSession.adminUser.id,
          action: 'membership_application_rejected',
          entityType: 'membership_application',
          entityId: application.id,
          description: `Rejected membership application for ${application.customer.name}: ${trimmedReason}`,
          metadata: { reason: trimmedReason },
        },
        tx,
      )
      return updated
    })
    await sendRejectionEmail({
      to: application.customer.email,
      name: application.customer.name,
      reason: updated.rejectionReason as string,
    })
    const rejectionEmailSent = true
    return Response.json({ ...updated, rejectionEmailSent }, { status: 200 })
  }

  const { rawToken, tokenHash, expiresAt } = generatePaymentLinkToken()

  const updatedApplication = await prisma.$transaction(async (tx) => {
    const updatedApplication = await tx.membershipApplication.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedById: activeSession.adminUser.id,
        reviewedAt,
      },
    })
    await logAdminActivity(
      {
        adminId: activeSession.adminUser.id,
        action: 'membership_application_approved',
        entityType: 'membership_application',
        entityId: application.id,
        description: `Approved membership application for ${application.customer.name} (${formatMembershipTier(application.requestedTier)})`,
        metadata: { tier: application.requestedTier },
      },
      tx,
    )
    await tx.membershipPaymentLinkToken.create({
      data: { applicationId: application.id, tokenHash, expiresAt },
    })
    return updatedApplication
  })

  // A quote, not a reservation: the seat is taken only when checkout creates the payment row.
  const quote = await quoteMembershipPrice(prisma, application.customerId, application.requestedTier)
  const tierName = formatMembershipPlanLabel(application.requestedTier, quote.isFounding)
  const amountCentavos = quote.amountCentavos
  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/membership/pay/${application.id}?token=${rawToken}`
  await sendMembershipPaymentEmail({
    to: application.customer.email,
    name: application.customer.name,
    tierName,
    amountCentavos,
    paymentUrl,
  })
  const paymentEmailSent = true

  return Response.json({ application: updatedApplication, paymentEmailSent }, { status: 200 })
}
