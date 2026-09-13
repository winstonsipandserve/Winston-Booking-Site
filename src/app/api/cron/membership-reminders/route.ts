import type { Membership } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { sendMembershipExpiryReminderEmail, sendMembershipExpiredEmail } from '@/lib/resend'
import { manilaCalendarDaysBetween } from '@/lib/manila-date'

export const dynamic = 'force-dynamic'

/**
 * A row is obsolete when the customer already holds a later term (an early renewal that
 * is queued, or a new membership bought after this one lapsed). Reminding them to renew,
 * or telling them they have expired, would contradict the membership they actually hold.
 */
async function hasLaterMembership(membership: Membership): Promise<boolean> {
  const later = await prisma.membership.findFirst({
    where: {
      customerId: membership.customerId,
      id: { not: membership.id },
      endDate: { gt: membership.endDate },
    },
    select: { id: true },
  })
  return later !== null
}

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
  let suppressedCount = 0

  // Each block sends then stamps its own sent-at column immediately, row by row — not batched
  // at the end — so a mid-run failure can't cause a retry to double-send an already-sent email.
  // The selection windows only decide *which* rows are due; the email itself is told the real
  // number of Manila calendar days left, which can be anywhere inside the window.

  // Rows already inside the 3-day window are excluded here so a member never gets the
  // 14-day and 3-day reminders in the same run — the 3-day block stamps both columns.
  const due14DayReminder = await prisma.membership.findMany({
    where: { endDate: { gt: in3Days, lte: in14Days }, reminder14SentAt: null },
    include: { customer: true },
    relationLoadStrategy: 'query',
  })
  for (const membership of due14DayReminder) {
    if (await hasLaterMembership(membership)) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { reminder14SentAt: now },
      })
      suppressedCount++
      continue
    }
    await sendMembershipExpiryReminderEmail(
      membership.customer,
      membership,
      manilaCalendarDaysBetween(now, membership.endDate),
    )
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
    if (await hasLaterMembership(membership)) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { reminder3SentAt: now, reminder14SentAt: membership.reminder14SentAt ?? now },
      })
      suppressedCount++
      continue
    }
    await sendMembershipExpiryReminderEmail(
      membership.customer,
      membership,
      manilaCalendarDaysBetween(now, membership.endDate),
    )
    await prisma.membership.update({
      where: { id: membership.id },
      data: { reminder3SentAt: now, reminder14SentAt: membership.reminder14SentAt ?? now },
    })
    reminder3SentCount++
  }

  const dueExpiredNotice = await prisma.membership.findMany({
    where: { endDate: { lte: now }, expiredNoticeSentAt: null },
    include: { customer: true },
    relationLoadStrategy: 'query',
  })
  for (const membership of dueExpiredNotice) {
    // Stamped even when suppressed so an obsolete row is never reconsidered on later runs.
    if (await hasLaterMembership(membership)) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { expiredNoticeSentAt: now },
      })
      suppressedCount++
      continue
    }
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
      suppressedCount,
    },
    { status: 200 },
  )
}
