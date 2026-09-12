import type { AnnouncementUrgency, Prisma } from '@prisma/client'

const URGENCY_ORDER: Record<AnnouncementUrgency, number> = {
  urgent: 0,
  warning: 1,
  info: 2,
}

export function activeAnnouncementWhere(now = new Date()): Prisma.AnnouncementWhereInput {
  return {
    isActive: true,
    startAt: { lte: now },
    OR: [{ endAt: null }, { endAt: { gt: now } }],
  }
}

export function sortAnnouncementsByUrgency<
  T extends { urgency: AnnouncementUrgency; startAt: Date },
>(announcements: T[]): T[] {
  return [...announcements].sort(
    (a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] || b.startAt.getTime() - a.startAt.getTime(),
  )
}

export function announcementIsClaimingResources(announcement: {
  isActive: boolean
  autoDisableResources: boolean
  startAt: Date
  endAt: Date | null
}, now = new Date()): boolean {
  return (
    announcement.isActive &&
    announcement.autoDisableResources &&
    announcement.startAt <= now &&
    (announcement.endAt === null || announcement.endAt > now)
  )
}
