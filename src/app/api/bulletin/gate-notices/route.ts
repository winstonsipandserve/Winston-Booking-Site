import { prisma } from '@/lib/prisma'
import { formatBulletinDate } from '@/lib/format'
import { bulletinNotExpiredWhere, bulletinOrderBy } from '@/lib/bulletin'

export async function GET() {
  const bulletins = await prisma.bulletin.findMany({
    // A promotion doesn't disrupt the booking flow the way a closure/maintenance notice
    // does, so it's excluded from the pre-booking announcement gate — see CLAUDE.md's
    // Bulletin / Promotion category decision. It still appears on /news.
    where: { isPublished: true, category: { not: 'Promotion' }, ...bulletinNotExpiredWhere() },
    orderBy: bulletinOrderBy,
  })

  const notices = bulletins.map((bulletin) => ({
    category: bulletin.category,
    title: bulletin.title,
    // The gate is a quick pre-booking scan, so it shows the one-line excerpt; the full
    // body is on /news.
    excerpt: bulletin.excerpt,
    publishedAt: formatBulletinDate(bulletin.publishedAt as Date),
    affectedFacility: bulletin.affectedFacility ?? undefined,
    action: bulletin.action ?? undefined,
  }))

  return Response.json({ notices }, { status: 200 })
}
