import type { Prisma } from '@prisma/client'
import { announcementIsClaimingResources } from '@/lib/announcement'

export { announcementIsClaimingResources }

export async function applyAnnouncementResourceDisable(
  tx: Prisma.TransactionClient,
  resourceIds: string[],
): Promise<void> {
  if (resourceIds.length === 0) return
  await tx.resource.updateMany({
    where: { id: { in: resourceIds }, isActive: true },
    // `bulletin` remains the expand-phase database value until contract cleanup.
    data: { isActive: false, disabledReason: 'bulletin' },
  })
}

export async function releaseAnnouncementResourceDisable(
  tx: Prisma.TransactionClient,
  resourceIds: string[],
  excludingAnnouncementId: string,
): Promise<void> {
  if (resourceIds.length === 0) return

  const candidates = await tx.resource.findMany({
    where: { id: { in: resourceIds }, isActive: false, disabledReason: 'bulletin' },
    select: { id: true },
  })
  if (candidates.length === 0) return

  const now = new Date()
  const stillClaimed = await tx.announcementResource.findMany({
    where: {
      resourceId: { in: candidates.map((candidate) => candidate.id) },
      announcementId: { not: excludingAnnouncementId },
      announcement: {
        isActive: true,
        autoDisableResources: true,
        startAt: { lte: now },
        OR: [{ endAt: null }, { endAt: { gt: now } }],
      },
    },
    select: { resourceId: true },
  })
  const stillClaimedIds = new Set(stillClaimed.map((link) => link.resourceId))
  const releasable = candidates.map((candidate) => candidate.id).filter((id) => !stillClaimedIds.has(id))

  if (releasable.length > 0) {
    await tx.resource.updateMany({
      where: { id: { in: releasable }, disabledReason: 'bulletin' },
      data: { isActive: true, disabledReason: null },
    })
  }
}
