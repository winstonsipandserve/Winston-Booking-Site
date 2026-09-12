import { prisma } from '@/lib/prisma'
import NewsManager from '@/components/admin/NewsManager'
import AdminPagination from '@/components/admin/AdminPagination'

const PAGE_SIZE = 10

export default async function AdminNewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const [posts, count] = await Promise.all([
    prisma.newsPost.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.newsPost.count(),
  ])
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="relative isolate flex h-full flex-col gap-4">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-6 hidden -z-10 dark:block dark:rounded-2xl dark:bg-gray-900" />
      <NewsManager posts={posts.map((post) => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        bodyHtml: post.bodyHtml,
        coverImageUrl: post.coverImageUrl,
        category: post.category,
        publishAt: post.publishAt?.toISOString() ?? null,
        status: post.status,
        isFeatured: post.isFeatured,
      }))} />
      <AdminPagination page={page} totalPages={totalPages} previousHref={`/admin/news?page=${Math.max(1, page - 1)}`} nextHref={`/admin/news?page=${Math.min(totalPages, page + 1)}`} />
    </div>
  )
}
