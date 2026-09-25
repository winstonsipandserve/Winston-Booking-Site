import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'
import { formatBulletinDate } from '@/lib/format'
import { NEWS_CATEGORY_LABELS, sanitizeNewsHtml } from '@/lib/news'

export const dynamic = 'force-dynamic'

async function getPublicPost(slug: string) {
  return prisma.newsPost.findFirst({
    where: {
      slug,
      status: 'published',
      publishAt: { lte: new Date() },
    },
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublicPost(slug)
  if (!post) return { title: 'News not found' }
  return {
    title: `${post.title} | Winston Sip & Serve`,
    description: post.bodyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
  }
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPublicPost(slug)
  if (!post || !post.publishAt) notFound()
  const bodyHtml = sanitizeNewsHtml(post.bodyHtml)

  return (
    <>
      <Navbar />
      <main>
        <header className="border-b border-gray-200 bg-white px-6 py-10 md:px-10">
          <div className="mx-auto max-w-4xl">
            <Link href="/news" className="text-sm font-medium text-gray-500 hover:text-gray-900">← Back to news</Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{NEWS_CATEGORY_LABELS[post.category]}</span>
              <time dateTime={post.publishAt.toISOString()} className="text-xs text-gray-400">{formatBulletinDate(post.publishAt)}</time>
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold text-gray-900 md:text-4xl">{post.title}</h1>
          </div>
        </header>

        <article className="bg-white px-6 py-10 md:px-10">
          <div className="mx-auto max-w-4xl">
            {post.coverImageUrl && (
              <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
                <Image src={post.coverImageUrl} alt="" fill priority sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" />
              </div>
            )}
            <div
              className="mx-auto max-w-3xl text-base leading-8 text-gray-700 [&_a]:font-medium [&_a]:text-gray-900 [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:my-6 [&_blockquote]:border-l [&_blockquote]:border-gray-300 [&_blockquote]:pl-5 [&_blockquote]:text-xl [&_blockquote]:italic [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-gray-900 [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_li]:my-2 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-5 [&_strong]:font-semibold [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
