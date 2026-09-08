import { prisma } from '@/lib/prisma'
import { expirePaymongoCheckoutSession } from '@/lib/paymongo'
import {
  applyBulletinResourceDisable,
  bulletinShouldDisableResources,
  releaseBulletinResourceDisable,
} from '@/lib/bulletin-resource-disable'

export const dynamic = 'force-dynamic'

const HOLD_MINUTES = Number(process.env.BOOKING_HOLD_MINUTES) || 10

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const holdCutoff = new Date(Date.now() - HOLD_MINUTES * 60000)

  let checkoutSessionIdsToExpire: string[] = []
  const staleBookings = await prisma.$transaction(async (tx) => {
    const stale = await tx.booking.findMany({
      where: {
        status: 'pending_payment',
        createdAt: { lt: holdCutoff },
      },
      include: { payment: true },
      relationLoadStrategy: 'query',
    })

    if (stale.length > 0) {
      const staleBookingIds = stale.map((b) => b.id)
      await tx.booking.updateMany({
        where: { id: { in: staleBookingIds } },
        data: { status: 'cancelled' },
      })
      await tx.payment.updateMany({
        where: { bookingId: { in: staleBookingIds } },
        data: { status: 'failed' },
      })
      checkoutSessionIdsToExpire = stale
        .filter((b) => b.payment?.status === 'pending' && b.payment.paymongoCheckoutSessionId != null)
        .map((b) => b.payment!.paymongoCheckoutSessionId!)
    }

    return stale
  })

  for (const checkoutSessionId of checkoutSessionIdsToExpire) {
    await expirePaymongoCheckoutSession(checkoutSessionId)
  }

  // Release resources whose disabling bulletin has expired — never touches isPublished
  // or any other Bulletin field. See CLAUDE.md → Bulletin-triggered resource auto-disable.
  const now = new Date()
  await prisma.$transaction(async (tx) => {
    const expiredBulletins = await tx.bulletin.findMany({
      where: {
        isPublished: true,
        autoDisableResources: true,
        expiresAt: { not: null, lte: now },
      },
      include: { resourceLinks: { select: { resourceId: true } } },
    })

    for (const bulletin of expiredBulletins) {
      const resourceIds = bulletin.resourceLinks.map((l) => l.resourceId)
      if (resourceIds.length > 0) {
        await releaseBulletinResourceDisable(tx, resourceIds, bulletin.id)
      }
    }
  })

  // Apply scheduled disables: a published, auto-disabling bulletin with a future eventStartAt
  // doesn't disable its linked resources until that start time arrives (see
  // bulletinShouldDisableResources). KNOWN LIMITATION: this cron runs once daily (Vercel
  // Hobby plan cap), so a scheduled disable takes effect on the next daily cron run after
  // eventStartAt passes, not at the exact time — same granularity as the expiry-release step
  // above. A more frequent cron is a separate Vercel-plan change (see CLAUDE.md).
  await prisma.$transaction(async (tx) => {
    const dueBulletins = await tx.bulletin.findMany({
      where: {
        isPublished: true,
        autoDisableResources: true,
        eventStartAt: { not: null, lte: now },
      },
      include: { resourceLinks: { select: { resourceId: true } } },
    })

    for (const bulletin of dueBulletins) {
      if (!bulletinShouldDisableResources(bulletin)) continue
      const resourceIds = bulletin.resourceLinks.map((l) => l.resourceId)
      if (resourceIds.length > 0) {
        await applyBulletinResourceDisable(tx, resourceIds)
      }
    }
  })

  return Response.json({ cancelledCount: staleBookings.length }, { status: 200 })
}
