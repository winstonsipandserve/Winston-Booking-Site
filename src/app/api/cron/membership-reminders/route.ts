import { prisma } from '@/lib/prisma'
import { sendMembershipExpiryReminderEmail, sendMembershipExpiredEmail } from '@/lib/resend'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60000)
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60000)

  let reminder14SentCount = 0
  let reminder3SentCount = 0
  let expiredNoticeSentCount = 0

  // Each block sends then stamps its own sent-at column immediately, row by row — not batched
  // at the end — so a mid-run failure can't cause a retry to double-send an already-sent email.

  const due14DayReminder = await prisma.membership.findMany({
    where: { endDate: { gt: now, lte: in14Days }, reminder14SentAt: null },
    include: { customer: true },
    relationLoadStrategy: 'query',
  })
  for (const membership of due14DayReminder) {
    await sendMembershipExpiryReminderEmail(membership.customer, membership, 14)
    await prisma.membership.update({
      where: { id: membership.id },
      data: { reminder14SentAt: now },
    })
    reminder14SentCount++
  }

  const due3DayReminder = await prisma.membership.findMany({
    where: { endDate: { gt: now, lte: in3Days }, reminder3SentAt: null },
    include: { customer: true },
    relationLoadStrategy: 'query',
  })
  for (const membership of due3DayReminder) {
    await sendMembershipExpiryReminderEmail(membership.customer, membership, 3)
    await prisma.membership.update({
      where: { id: membership.id },
      data: { reminder3SentAt: now },
    })
    reminder3SentCount++
  }

  const dueExpiredNotice = await prisma.membership.findMany({
    where: { endDate: { lte: now }, expiredNoticeSentAt: null },
    include: { customer: true },
    relationLoadStrategy: 'query',
  })
  for (const membership of dueExpiredNotice) {
    await sendMembershipExpiredEmail(membership.customer, membership)
    await prisma.membership.update({
      where: { id: membership.id },
      data: { expiredNoticeSentAt: now },
    })
    expiredNoticeSentCount++
  }

  return Response.json(
    {
      reminder14SentCount,
      reminder3SentCount,
      expiredNoticeSentCount,
    },
    { status: 200 },
  )
}
