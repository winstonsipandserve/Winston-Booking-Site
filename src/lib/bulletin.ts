import type { Prisma } from '@prisma/client'

/** A bulletin is "live" (not expired) when expiresAt is unset or still in the future. */
export function bulletinNotExpiredWhere(): Prisma.BulletinWhereInput {
  return {
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  }
}

/** Shared sort for public bulletin surfaces: High priority first, then most recently published. */
export const bulletinOrderBy: Prisma.BulletinOrderByWithRelationInput[] = [
  { priority: 'desc' },
  { publishedAt: 'desc' },
]
