import { prisma } from '@/lib/prisma'
import { activeAnnouncementWhere, sortAnnouncementsByUrgency } from '@/lib/announcement'
import { formatBookingDateTime } from '@/lib/format'

export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()
  const announcements = await prisma.announcement.findMany({
    where: activeAnnouncementWhere(now),
    include: {
      resourceLinks: {
        include: { resource: { include: { resourceType: true } } },
      },
    },
  })

  const notices = sortAnnouncementsByUrgency(announcements).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    message: announcement.message,
    urgency: announcement.urgency,
    upcoming: announcement.startAt > now,
    startAt: formatBookingDateTime(announcement.startAt),
    endAt: announcement.endAt ? formatBookingDateTime(announcement.endAt) : null,
    affectedResources: announcement.resourceLinks.map(
      (link) => `${link.resource.resourceType.name} — ${link.resource.label}`,
    ),
  }))

  return Response.json({ notices }, { status: 200 })
}
