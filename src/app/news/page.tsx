import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NewsGrid, { type NewsItem } from '@/components/news/NewsGrid'
import NewsHeader from '@/components/news/NewsHeader'
import { prisma } from '@/lib/prisma'
import { formatBulletinDate } from '@/lib/format'
import { newsHtmlToPreview } from '@/lib/news'

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const now = new Date()
  const posts = await prisma.newsPost.findMany({
    where: { status: 'published', publishAt: { lte: now } },
    orderBy: [{ isFeatured: 'desc' }, { publishAt: 'desc' }],
  })

  const items: NewsItem[] = posts.map((post) => ({
    id: post.id,
    slug: post.slug,
    category: post.category,
    title: post.title,
    preview: newsHtmlToPreview(post.bodyHtml),
    date: formatBulletinDate(post.publishAt as Date),
    coverImageUrl: post.coverImageUrl,
    isFeatured: post.isFeatured,
  }))

  return (
    <>
      <Navbar />
      <NewsHeader />
      <Suspense fallback={null}><NewsGrid items={items} /></Suspense>
      <Footer />
    </>
  )
}
