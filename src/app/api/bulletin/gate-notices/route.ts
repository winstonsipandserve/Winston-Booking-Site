import { prisma } from '@/lib/prisma'
import { formatBulletinDate } from '@/lib/format'
import { bulletinNotExpiredWhere, bulletinOrderBy } from '@/lib/bulletin'

export async function GET() {
  const bulletins = await prisma.bulletin.findMany({
    where: { isPublished: true, ...bulletinNotExpiredWhere() },
    orderBy: bulletinOrderBy,
    take: 3,
  })

  const notices = bulletins.map((bulletin) => ({
    category: bulletin.category,
    title: bulletin.title,
    body: bulletin.body,
    publishedAt: formatBulletinDate(bulletin.publishedAt as Date),
    affectedFacility: bulletin.affectedFacility ?? undefined,
    action: bulletin.action ?? undefined,
  }))

  return Response.json({ notices }, { status: 200 })
}
