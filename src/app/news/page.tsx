import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NewsHero from '@/components/news/NewsHero'
import NewsGrid from '@/components/news/NewsGrid'
import { prisma } from '@/lib/prisma'
import type { NewsItem } from '@/components/news/NewsGrid'

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Manila' })
}

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
    date: formatMonthYear(bulletin.publishedAt as Date),
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
