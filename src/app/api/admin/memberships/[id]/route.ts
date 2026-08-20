import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIER_PLANS, computeMembershipEndDate } from '@/lib/membership-pricing'

interface ReviewRequestBody {
  action?: unknown
  reason?: unknown
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
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

  const application = await prisma.membershipApplication.findUnique({ where: { id } })
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
        reviewedById: session.user.id,
        reviewedAt,
      },
    })
    return Response.json(updated, { status: 200 })
  }

  const plan = MEMBERSHIP_TIER_PLANS[application.requestedTier]
  const endDate = computeMembershipEndDate(reviewedAt, application.requestedTier)

  const result = await prisma.$transaction(async (tx) => {
    const updatedApplication = await tx.membershipApplication.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedById: session.user.id,
        reviewedAt,
      },
    })

    const membership = await tx.membership.create({
      data: {
        customerId: application.customerId,
        applicationId: application.id,
        tier: application.requestedTier,
        status: 'active',
        startDate: reviewedAt,
        endDate,
        activationFeeCentavos: plan.activationFeeCentavos,
        creditBalanceCentavos: plan.creditCentavos,
      },
    })

    await tx.membershipCreditTransaction.create({
      data: {
        membershipId: membership.id,
        amountCentavos: plan.creditCentavos,
        reason: 'activation',
      },
    })

    return { application: updatedApplication, membership }
  })

  return Response.json(result, { status: 200 })
}
