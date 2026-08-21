import { prisma } from '@/lib/prisma'
import BulletinList from '@/components/admin/BulletinList'

export default async function AdminBulletinPage() {
  const bulletins = await prisma.bulletin.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold text-gray-900">Bulletin</h1>
      <p className="mb-6 text-sm italic text-gray-400">
        Add/Edit/Delete are live — bulletins persist to the database and their images to the{' '}
        <code>bulletin-images</code> Storage bucket.
      </p>

      <BulletinList bulletins={bulletins} />
    </div>
  )
}
