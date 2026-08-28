import { prisma } from '@/lib/prisma'
import BulletinList from '@/components/admin/BulletinList'
import BulletinAddButton from '@/components/admin/BulletinAddButton'

export default async function AdminBulletinPage() {
  const bulletins = await prisma.bulletin.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Bulletin</h1>
        <BulletinAddButton />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-xl border border-gray-200 p-4">
        <BulletinList bulletins={bulletins} />
      </div>
    </div>
  )
}
