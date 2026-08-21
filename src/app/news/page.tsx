import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NewsHero from '@/components/news/NewsHero'
import NewsGrid from '@/components/news/NewsGrid'
import { prisma } from '@/lib/prisma'
import { formatBulletinDate } from '@/lib/format'
import type { NewsItem } from '@/components/news/NewsGrid'

export default async function NewsPage() {
  const bulletins = await prisma.bulletin.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
  })

  const items: NewsItem[] = bulletins.map((bulletin) => ({
    id: bulletin.id,
    category: bulletin.category,
    title: bulletin.title,
    excerpt: bulletin.excerpt,
    date: formatBulletinDate(bulletin.publishedAt as Date),
    image: bulletin.imageUrl,
    socialPlatform: bulletin.socialPlatform as NewsItem['socialPlatform'],
    socialUrl: bulletin.socialUrl ?? undefined,
  }))

  return (
    <>
      <Navbar />
      <NewsHero />
      <NewsGrid items={items} />
      <Footer />
    </>
  )
}
