import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { formatMembershipTier } from '@/lib/format'
import { sendMembershipPaymentEmail, sendRejectionEmail } from '@/lib/resend'

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
    const updated = await prisma.membershipApplication.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: (reason as string).trim(),
        reviewedById: activeSession.adminUser.id,
        reviewedAt,
      },
    })
    await sendRejectionEmail({
      to: application.customer.email,
      name: application.customer.name,
      reason: updated.rejectionReason as string,
    })
    const rejectionEmailSent = true
    return Response.json({ ...updated, rejectionEmailSent }, { status: 200 })
  }

  const updatedApplication = await prisma.membershipApplication.update({
    where: { id },
    data: {
      status: 'approved',
      reviewedById: activeSession.adminUser.id,
      reviewedAt,
    },
  })

  const tierName = formatMembershipTier(application.requestedTier)
  const amountCentavos = MEMBERSHIP_TIER_PLANS[application.requestedTier].totalCentavos
  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/membership/pay/${application.id}`
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
