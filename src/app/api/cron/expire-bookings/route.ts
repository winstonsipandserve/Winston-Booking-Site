import { prisma } from '@/lib/prisma'
import { expirePaymongoCheckoutSession } from '@/lib/paymongo'
import {
  applyAnnouncementResourceDisable,
  announcementIsClaimingResources,
  releaseAnnouncementResourceDisable,
} from '@/lib/announcement-resource-disable'
import {
  MEMBERSHIP_APPLICATION_BUCKET,
  MEMBERSHIP_APPLICATION_UPLOAD_PREFIX,
} from '@/lib/membership-application-uploads'
import { deleteFromStorage, listStorageObjects } from '@/lib/supabase-storage'

export const dynamic = 'force-dynamic'

const HOLD_MINUTES = Number(process.env.BOOKING_HOLD_MINUTES) || 10
const PENDING_MEMBERSHIP_UPLOAD_MAX_AGE_MS = 3 * 60 * 60 * 1000

async function removeExpiredMembershipUploads(now: Date): Promise<number> {
  const sessionFolders = await listStorageObjects(
    MEMBERSHIP_APPLICATION_BUCKET,
    `${MEMBERSHIP_APPLICATION_UPLOAD_PREFIX}/`,
  )
  const cutoff = now.getTime() - PENDING_MEMBERSHIP_UPLOAD_MAX_AGE_MS
  const expiredPaths: string[] = []

  for (const folder of sessionFolders.slice(0, 100)) {
    if (!/^[0-9a-f-]{36}$/i.test(folder.name)) continue
    const paths = await listStorageObjects(
      MEMBERSHIP_APPLICATION_BUCKET,
      `${MEMBERSHIP_APPLICATION_UPLOAD_PREFIX}/${folder.name}/`,
    )
    for (const object of paths) {
      const createdAt = new Date(object.created_at ?? object.updated_at ?? '')
      if (!Number.isNaN(createdAt.getTime()) && createdAt.getTime() < cutoff) {
        expiredPaths.push(`${MEMBERSHIP_APPLICATION_UPLOAD_PREFIX}/${folder.name}/${object.name}`)
      }
    }
  }

  if (expiredPaths.length > 0) {
    await deleteFromStorage(MEMBERSHIP_APPLICATION_BUCKET, expiredPaths)
  }
  return expiredPaths.length
}

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

  // Release resources whose disabling announcement has ended. The resource helper
  // preserves manual disables and overlapping announcement claims.
  const now = new Date()
  let expiredMembershipUploadCount = 0
  try {
    expiredMembershipUploadCount = await removeExpiredMembershipUploads(now)
  } catch (error) {
    // The privacy cleanup must not prevent booking holds from expiring. A later daily
    // run retries it, and the temporary objects remain in a private bucket meanwhile.
    console.error('Failed to remove expired membership document uploads', error)
  }
  await prisma.$transaction(async (tx) => {
    const endedAnnouncements = await tx.announcement.findMany({
      where: {
        isActive: true,
        autoDisableResources: true,
        endAt: { not: null, lte: now },
      },
      include: { resourceLinks: { select: { resourceId: true } } },
    })

    for (const announcement of endedAnnouncements) {
      const resourceIds = announcement.resourceLinks.map((link) => link.resourceId)
      if (resourceIds.length > 0) {
        await releaseAnnouncementResourceDisable(tx, resourceIds, announcement.id)
      }
    }
  })

  // Apply scheduled disables after startAt. KNOWN LIMITATION: this cron runs once daily (Vercel
  // Hobby plan cap), so a scheduled disable takes effect on the next daily cron run after
  // startAt passes, not at the exact time — same granularity as the expiry-release step
  // above. A more frequent cron is a separate Vercel-plan change (see CLAUDE.md).
  await prisma.$transaction(async (tx) => {
    const dueAnnouncements = await tx.announcement.findMany({
      where: {
        isActive: true,
        autoDisableResources: true,
        startAt: { lte: now },
      },
      include: { resourceLinks: { select: { resourceId: true } } },
    })

    for (const announcement of dueAnnouncements) {
      if (!announcementIsClaimingResources(announcement, now)) continue
      const resourceIds = announcement.resourceLinks.map((link) => link.resourceId)
      if (resourceIds.length > 0) {
        await applyAnnouncementResourceDisable(tx, resourceIds)
      }
    }
  })

  return Response.json({ cancelledCount: staleBookings.length, expiredMembershipUploadCount }, { status: 200 })
}
