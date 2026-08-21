import { prisma } from '@/lib/prisma'
import { formatBulletinDate } from '@/lib/format'

export async function GET() {
  const bulletins = await prisma.bulletin.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  })

  const notices = bulletins.map((bulletin) => ({
    category: bulletin.category,
    title: bulletin.title,
    body: bulletin.body,
    publishedAt: formatBulletinDate(bulletin.publishedAt as Date),
  }))

  return Response.json({ notices }, { status: 200 })
}
