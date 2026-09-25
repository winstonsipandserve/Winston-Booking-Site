import type { AnnouncementUrgency, Prisma } from '@prisma/client'

const URGENCY_ORDER: Record<AnnouncementUrgency, number> = {
  urgent: 0,
  warning: 1,
  info: 2,
}

/**
 * Notices customers can see on /book right now: active, past the advance-notice
 * date (or the start date when no advance date is set), and not yet ended.
 */
export function activeAnnouncementWhere(now = new Date()): Prisma.AnnouncementWhereInput {
  return {
    isActive: true,
    AND: [
      { OR: [{ announceAt: { lte: now } }, { announceAt: null, startAt: { lte: now } }] },
      { OR: [{ endAt: null }, { endAt: { gt: now } }] },
    ],
  }
}

export function announcementVisibleFrom(announcement: { announceAt: Date | null; startAt: Date }): Date {
  return announcement.announceAt ?? announcement.startAt
}

export function announcementIsVisible(
  announcement: { isActive: boolean; announceAt: Date | null; startAt: Date; endAt: Date | null },
  now = new Date(),
): boolean {
  return (
    announcement.isActive &&
    announcementVisibleFrom(announcement) <= now &&
    (announcement.endAt === null || announcement.endAt > now)
  )
}

export function sortAnnouncementsByUrgency<
  T extends { urgency: AnnouncementUrgency; startAt: Date },
>(announcements: T[]): T[] {
  return [...announcements].sort(
    (a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] || b.startAt.getTime() - a.startAt.getTime(),
  )
}

/**
 * Resource auto-disable follows the operational window (`startAt`..`endAt`), never the
 * advance-notice date, so an announced closure keeps its courts bookable until it starts.
 */
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
