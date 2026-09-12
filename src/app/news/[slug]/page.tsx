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
        <header className="bg-brand-dark px-6 pb-14 pt-36 md:px-10 md:pb-20 md:pt-44">
          <div className="mx-auto max-w-4xl">
            <Link href="/news" className="text-sm font-medium text-brand-light/70 transition-colors hover:text-accent-light">← Back to news</Link>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-accent-primary px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white">{NEWS_CATEGORY_LABELS[post.category]}</span>
              <time dateTime={post.publishAt.toISOString()} className="font-mono text-xs text-brand-light/60">{formatBulletinDate(post.publishAt)}</time>
            </div>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight text-accent-light md:text-6xl">{post.title}</h1>
          </div>
        </header>

        <article className="bg-background px-6 py-12 md:px-10 md:py-16">
          <div className="mx-auto max-w-4xl">
            {post.coverImageUrl && (
              <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-card bg-brand-dark/5 shadow-card">
                <Image src={post.coverImageUrl} alt="" fill priority sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" />
              </div>
            )}
            <div
              className="mx-auto max-w-3xl text-base leading-8 text-neutral-700 [&_a]:font-medium [&_a]:text-accent-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:my-6 [&_blockquote]:border-l [&_blockquote]:border-brand-dark/25 [&_blockquote]:pl-5 [&_blockquote]:font-serif [&_blockquote]:text-xl [&_blockquote]:italic [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:leading-tight [&_h2]:text-brand-dark [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:font-serif [&_h3]:text-2xl [&_h3]:text-brand-dark [&_li]:my-2 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-5 [&_strong]:font-semibold [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
