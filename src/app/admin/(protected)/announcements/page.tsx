import { prisma } from '@/lib/prisma'
import AnnouncementManager from '@/components/admin/AnnouncementManager'
import AdminPagination from '@/components/admin/AdminPagination'

const PAGE_SIZE = 10

export default async function AdminAnnouncementsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const [announcements, count, resources] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: { resourceLinks: { include: { resource: { include: { resourceType: true } } } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.announcement.count(),
    prisma.resource.findMany({ include: { resourceType: true }, orderBy: [{ resourceType: { name: 'asc' } }, { label: 'asc' }] }),
  ])
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="relative isolate flex h-full flex-col gap-4">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-6 hidden -z-10 dark:block dark:rounded-2xl dark:bg-gray-900" />
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Announcements</h1>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <AnnouncementManager
          announcements={announcements.map((announcement) => ({
            id: announcement.id,
            title: announcement.title,
            message: announcement.message,
            urgency: announcement.urgency,
            isActive: announcement.isActive,
            announceAt: announcement.announceAt?.toISOString() ?? null,
            startAt: announcement.startAt.toISOString(),
            endAt: announcement.endAt?.toISOString() ?? null,
            autoDisableResources: announcement.autoDisableResources,
            resourceIds: announcement.resourceLinks.map((link) => link.resourceId),
            resourceNames: announcement.resourceLinks.map((link) => `${link.resource.resourceType.name} — ${link.resource.label}`),
          }))}
          resources={resources.map((resource) => ({ id: resource.id, displayName: `${resource.resourceType.name} — ${resource.label}` }))}
        />
      </div>
      <AdminPagination page={page} totalPages={totalPages} previousHref={`/admin/announcements?page=${Math.max(1, page - 1)}`} nextHref={`/admin/announcements?page=${Math.min(totalPages, page + 1)}`} />
    </div>
  )
}
