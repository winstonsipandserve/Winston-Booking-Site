import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NewsGrid from '@/components/news/NewsGrid'
import { prisma } from '@/lib/prisma'
import { formatBulletinDate, formatBookingDateTime } from '@/lib/format'
import { bulletinNotExpiredWhere, bulletinOrderBy } from '@/lib/bulletin'
import type { NewsItem } from '@/components/news/NewsGrid'

export default async function NewsPage() {
  const bulletins = await prisma.bulletin.findMany({
    where: { isPublished: true, ...bulletinNotExpiredWhere() },
    orderBy: bulletinOrderBy,
  })

  const items: NewsItem[] = bulletins.map((bulletin) => ({
    id: bulletin.id,
    category: bulletin.category,
    title: bulletin.title,
    excerpt: bulletin.excerpt,
    body: bulletin.body,
    date: formatBulletinDate(bulletin.publishedAt as Date),
    image: bulletin.imageUrl,
    socialPlatform: bulletin.socialPlatform as NewsItem['socialPlatform'],
    socialUrl: bulletin.socialUrl ?? undefined,
    affectedFacility: bulletin.affectedFacility ?? undefined,
    impact: bulletin.impact ?? undefined,
    action: bulletin.action ?? undefined,
    eventStartAt: bulletin.eventStartAt ? formatBookingDateTime(bulletin.eventStartAt) : undefined,
    eventEndAt: bulletin.eventEndAt ? formatBookingDateTime(bulletin.eventEndAt) : undefined,
    ctaLabel: bulletin.ctaLabel ?? undefined,
    ctaUrl: bulletin.ctaUrl ?? undefined,
  }))

  return (
    <>
      <Navbar />
      <NewsGrid items={items} />
      <Footer />
    </>
  )
}
