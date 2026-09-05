import { prisma } from '@/lib/prisma'
import BulletinList from '@/components/admin/BulletinList'
import BulletinAddButton from '@/components/admin/BulletinAddButton'

export default async function AdminBulletinPage() {
  const bulletins = await prisma.bulletin.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="relative isolate flex h-full flex-col gap-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 hidden -z-10 dark:block dark:rounded-2xl dark:bg-gray-900"
      />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Bulletin</h1>
        <BulletinAddButton />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <BulletinList bulletins={bulletins} />
      </div>
    </div>
  )
}
