import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { logAdminActivity } from '@/lib/admin-activity-log'
import { formatCentavos } from '@/lib/format'
import { ADMIN_TOPUP_MIN_CENTAVOS } from '@/lib/membership-topup'

interface AdminCreditTopUpRequestBody {
  mode?: unknown
  amountCentavos?: unknown
  note?: unknown
  externalReference?: unknown
}

function isTopUpMode(value: unknown): value is 'cash' | 'manual_online' {
  return value === 'cash' || value === 'manual_online'
}

// NOTE: unlike the sibling routes under /api/admin/memberships/[id]/*, which resolve [id]
// as a MembershipApplication id, this route's [id] is a Membership id directly — the admin
// UI passes latestMembership.id here, not application.id. See CLAUDE.md → Membership credit
// ledger and the admin memberships detail page's Add Credit button.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: AdminCreditTopUpRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { mode, amountCentavos, note, externalReference } = body

  if (!isTopUpMode(mode)) {
    return Response.json({ error: "mode must be 'cash' or 'manual_online'" }, { status: 400 })
  }

  if (
    typeof amountCentavos !== 'number' ||
    !Number.isInteger(amountCentavos) ||
    amountCentavos < ADMIN_TOPUP_MIN_CENTAVOS
  ) {
    return Response.json(
      { error: `Amount must be a whole number of at least ${formatCentavos(ADMIN_TOPUP_MIN_CENTAVOS)}` },
      { status: 400 },
    )
  }

  const trimmedNote = typeof note === 'string' ? note.trim() : ''
  const trimmedReference = typeof externalReference === 'string' ? externalReference.trim() : ''

  if (mode === 'cash' && trimmedNote.length === 0) {
    return Response.json({ error: 'A note is required for cash top-ups' }, { status: 400 })
  }
  if (mode === 'manual_online' && trimmedReference.length === 0) {
    return Response.json({ error: 'A reference is required for online top-ups' }, { status: 400 })
  }

  const membership = await prisma.membership.findUnique({
    where: { id },
    include: { customer: true },
  })
  if (!membership) {
    return Response.json({ error: 'Membership not found' }, { status: 404 })
  }
  if (membership.status !== 'active' || membership.endDate < new Date()) {
    return Response.json({ error: 'This membership is not currently active' }, { status: 400 })
  }

  const paidAt = new Date()

  const updatedMembership = await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        status: 'paid',
        paidAt,
        method: mode,
        amountCentavos,
        membershipId: membership.id,
        initiatedByAdminId: activeSession.adminUser.id,
        adminNote: trimmedNote.length > 0 ? trimmedNote : null,
        externalReference: trimmedReference.length > 0 ? trimmedReference : null,
      },
    })

    await tx.membershipCreditTransaction.create({
      data: {
        membershipId: membership.id,
        amountCentavos,
        reason: 'top_up',
      },
    })

    const updated = await tx.membership.update({
      where: { id: membership.id },
      data: { creditBalanceCentavos: { increment: amountCentavos } },
    })

    await logAdminActivity(
      {
        adminId: activeSession.adminUser.id,
        action: 'membership_credit_topup_added',
        entityType: 'membership',
        entityId: membership.id,
        description: `Added ${formatCentavos(amountCentavos)} credit to ${membership.customer.name} (${mode === 'cash' ? 'cash' : 'online'})`,
        metadata: { mode, amountCentavos },
      },
      tx,
    )

    return updated
  })

  return Response.json(
    { creditBalanceCentavos: updatedMembership.creditBalanceCentavos },
    { status: 200 },
  )
}
