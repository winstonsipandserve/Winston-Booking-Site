import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { generateActivationToken } from '@/lib/member-activation'
import { sendActivationReminderEmail } from '@/lib/resend'
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
    include: { customer: true },
  })
  if (!application) {
    return Response.json({ error: 'Membership application not found' }, { status: 404 })
  }

  if (application.customer.passwordHash) {
    return Response.json(
      { error: 'This member has already set a password' },
      { status: 409 },
    )
  }

  const { rawToken, tokenHash, expiresAt } = generateActivationToken()

  // A newly issued link supersedes every earlier link, mirroring the same precaution the
  // forgot-password flow takes with reset tokens.
  await prisma.$transaction(async (tx) => {
    const now = new Date()
    await tx.memberActivationToken.updateMany({
      where: { customerId: application.customerId, usedAt: null },
      data: { usedAt: now },
    })
    await tx.memberActivationToken.create({
      data: { customerId: application.customerId, tokenHash, expiresAt },
    })
  })

  await logAdminActivity({
    adminId: activeSession.adminUser.id,
    action: 'member_activation_link_resent',
    entityType: 'membership_application',
    entityId: application.id,
    description: `Resent activation email to ${application.customer.name}`,
    metadata: { customerId: application.customerId },
  })

  const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/activate?token=${rawToken}`
  await sendActivationReminderEmail({
    to: application.customer.email,
    name: application.customer.name,
    activationUrl,
  })

  return Response.json({ success: true }, { status: 200 })
}
