import type { Prisma } from '@prisma/client'

/**
 * True when a bulletin's own fields mean it should currently be claiming/holding its
 * linked resources disabled: published, the auto-disable toggle on, not expired, and
 * (if it has a future eventStartAt) that start time has already arrived — this lets a
 * closure be announced in advance without disabling the resource immediately. Pure
 * field check — never queries the DB itself, so callers can evaluate it against either
 * a live row or a hypothetical old/new field combination (see the PATCH route).
 */
export function bulletinShouldDisableResources(bulletin: {
  isPublished: boolean
  autoDisableResources: boolean
  expiresAt: Date | null
  eventStartAt: Date | null
}): boolean {
  return (
    bulletin.isPublished &&
    bulletin.autoDisableResources &&
    (bulletin.expiresAt === null || bulletin.expiresAt > new Date()) &&
    (bulletin.eventStartAt === null || bulletin.eventStartAt <= new Date())
  )
}

/**
 * Disables each given resource for the 'bulletin' reason, but only if it's currently
 * active — a resource already inactive for any reason keeps its existing disabledReason
 * (never steals attribution from an existing manual disable or another bulletin's claim).
 */
export async function applyBulletinResourceDisable(
  tx: Prisma.TransactionClient,
  resourceIds: string[],
): Promise<void> {
  if (resourceIds.length === 0) return
  await tx.resource.updateMany({
    where: { id: { in: resourceIds }, isActive: true },
    data: { isActive: false, disabledReason: 'bulletin' },
  })
}

/**
 * Re-enables each given resource, but only if it's currently disabled for the 'bulletin'
 * reason (a manual disable is never touched) AND no other published, auto-disabling,
 * unexpired bulletin still links to it (excludingBulletinId is the bulletin whose own
 * change triggered this release — its own link never counts as "another" claim).
 */
export async function releaseBulletinResourceDisable(
  tx: Prisma.TransactionClient,
  resourceIds: string[],
  excludingBulletinId: string,
): Promise<void> {
  if (resourceIds.length === 0) return

  const candidates = await tx.resource.findMany({
    where: { id: { in: resourceIds }, isActive: false, disabledReason: 'bulletin' },
    select: { id: true },
  })
  if (candidates.length === 0) return

  const now = new Date()
  const stillClaimed = await tx.bulletinResource.findMany({
    where: {
      resourceId: { in: candidates.map((c) => c.id) },
      bulletinId: { not: excludingBulletinId },
      bulletin: {
        isPublished: true,
        autoDisableResources: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    },
    select: { resourceId: true },
  })
  const stillClaimedIds = new Set(stillClaimed.map((r) => r.resourceId))

  const toRelease = candidates.map((c) => c.id).filter((id) => !stillClaimedIds.has(id))
  if (toRelease.length === 0) return

  await tx.resource.updateMany({
    where: { id: { in: toRelease } },
    data: { isActive: true, disabledReason: null },
  })
}
