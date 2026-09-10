import { prisma } from '@/lib/prisma'
import BulletinList from '@/components/admin/BulletinList'
import BulletinAddButton from '@/components/admin/BulletinAddButton'
import AdminPagination from '@/components/admin/AdminPagination'

const PAGE_SIZE = 10

export default async function AdminBulletinPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const [bulletins, totalCount, resources] = await Promise.all([
    prisma.bulletin.findMany({
      orderBy: { createdAt: 'desc' },
      include: { resourceLinks: { include: { resource: { include: { resourceType: true } } } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.bulletin.count(),
    prisma.resource.findMany({
      include: { resourceType: true },
      orderBy: [{ resourceType: { name: 'asc' } }, { label: 'asc' }],
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  function pageHref(targetPage: number) {
    return `/admin/bulletin?page=${targetPage}`
  }

  const resourceOptions = resources.map((r) => ({
    id: r.id,
    displayName: `${r.resourceType.name} — ${r.label}`,
  }))

  return (
    <div className="relative isolate flex h-full flex-col gap-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 hidden -z-10 dark:block dark:rounded-2xl dark:bg-gray-900"
      />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Bulletin</h1>
        <BulletinAddButton resourceOptions={resourceOptions} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <BulletinList bulletins={bulletins} resourceOptions={resourceOptions} />
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        previousHref={pageHref(Math.max(1, page - 1))}
        nextHref={pageHref(Math.min(totalPages, page + 1))}
      />
    </div>
  )
}
