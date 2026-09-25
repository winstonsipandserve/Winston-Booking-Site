'use client'

import { useState } from 'react'
import { CalendarIcon } from '@/components/ui/Icons'
import { formatBulletinDate } from '@/lib/format'
import { NEWS_CATEGORY_LABELS, newsHtmlToPreview } from '@/lib/news'
import type { NewsCategory } from '@/components/news/NewsGrid'

// Live preview for the admin news form. Mirrors the three reader-facing looks — the
// featured card, the standard grid card (both from NewsCard), and the full article at
// /news/[slug] — using plain <img> so freshly picked blob: covers render, and no links.
// Body HTML comes straight from the editor (which only emits the allowed tags) or from a
// post that was already sanitized on save, so it is safe to render without re-sanitizing.

export interface NewsPreviewProps {
  title: string
  bodyHtml: string
  category: NewsCategory
  publishAt: string
  coverUrl: string | null
  isFeatured: boolean
}

type PreviewView = 'card' | 'article'

function hasReadableText(html: string): boolean {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim().length > 0
}

function CategoryBadge({ category }: { category: NewsCategory }) {
  return (
    <span className="inline-flex rounded-full bg-brand-dark px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wide text-brand-light">
      {NEWS_CATEGORY_LABELS[category]}
    </span>
  )
}

function PostedDate({ date }: { date: string }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-xs text-brand-dark/50">
      <CalendarIcon className="h-3.5 w-3.5" />
      {date}
    </span>
  )
}

function CoverOrMonogram({ coverUrl, sizeClassName }: { coverUrl: string | null; sizeClassName: string }) {
  if (coverUrl) return <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
  return <div className={`flex h-full min-h-48 items-center justify-center font-serif text-brand-dark/20 ${sizeClassName}`} aria-hidden="true">W</div>
}

function FeaturedCardPreview({ title, excerpt, category, date, coverUrl }: { title: string; excerpt: string; category: NewsCategory; date: string; coverUrl: string | null }) {
  return (
    <article className="overflow-hidden rounded-card border border-brand-dark/15 bg-brand-light shadow-card">
      <div className="flex flex-col sm:min-h-[16rem] sm:flex-row">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-brand-dark/5 sm:aspect-auto sm:w-[45%]">
          <CoverOrMonogram coverUrl={coverUrl} sizeClassName="text-5xl" />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-3"><CategoryBadge category={category} /><span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-accent-primary">Featured</span></div>
          <h2 className="mt-4 font-serif text-2xl leading-tight text-brand-dark">{title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{excerpt}</p>
          <div className="mt-auto flex items-center justify-between gap-4 pt-8"><PostedDate date={date} /><span className="text-sm font-semibold text-accent-primary">Read article →</span></div>
        </div>
      </div>
    </article>
  )
}

function StandardCardPreview({ title, excerpt, category, date, coverUrl }: { title: string; excerpt: string; category: NewsCategory; date: string; coverUrl: string | null }) {
  return (
    <article className="mx-auto w-full max-w-xs overflow-hidden rounded-card border border-brand-dark/15 bg-brand-light shadow-card">
      <div className="flex flex-col">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-brand-dark/5">
          <CoverOrMonogram coverUrl={coverUrl} sizeClassName="text-4xl" />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div><CategoryBadge category={category} /></div>
          <h3 className="mt-4 font-serif text-xl leading-snug text-brand-dark">{title}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-700">{excerpt}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-6"><PostedDate date={date} /><span className="text-sm font-semibold text-accent-primary">Read →</span></div>
        </div>
      </div>
    </article>
  )
}

function ArticlePreview({ title, bodyHtml, category, date, coverUrl, hasTitle }: { title: string; bodyHtml: string; category: NewsCategory; date: string; coverUrl: string | null; hasTitle: boolean }) {
  const hasBody = hasReadableText(bodyHtml)
  return (
    <div className="overflow-hidden rounded-card border border-brand-dark/15 bg-background shadow-card">
      <header className="bg-brand-dark px-6 pb-8 pt-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-accent-primary px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white">{NEWS_CATEGORY_LABELS[category]}</span>
          <span className="font-mono text-xs text-brand-light/60">{date}</span>
        </div>
        <h1 className={`mt-4 font-serif text-2xl leading-tight md:text-3xl ${hasTitle ? 'text-accent-light' : 'text-accent-light/40'}`}>{title}</h1>
      </header>
      <div className="px-6 py-8">
        {coverUrl && (
          <div className="mb-8 aspect-[16/9] overflow-hidden rounded-card bg-brand-dark/5 shadow-card">
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        {hasBody ? (
          <div
            className="text-sm leading-7 text-neutral-700 [&_a]:font-medium [&_a]:text-accent-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:my-5 [&_blockquote]:border-l [&_blockquote]:border-brand-dark/25 [&_blockquote]:pl-4 [&_blockquote]:font-serif [&_blockquote]:text-lg [&_blockquote]:italic [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:leading-tight [&_h2]:text-brand-dark [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-brand-dark [&_li]:my-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_strong]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : (
          <p className="text-sm italic text-neutral-700/50">Your article body will appear here as you write.</p>
        )}
      </div>
    </div>
  )
}

export default function NewsPreview({ title, bodyHtml, category, publishAt, coverUrl, isFeatured }: NewsPreviewProps) {
  const [view, setView] = useState<PreviewView>('card')
  const parsedDate = publishAt ? new Date(publishAt) : null
  const date = formatBulletinDate(parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : new Date())
  const hasTitle = title.trim().length > 0
  const displayTitle = hasTitle ? title.trim() : 'Your headline will appear here'
  const excerpt = newsHtmlToPreview(bodyHtml) || 'Your article body will appear here as you write.'

  const tabBase = 'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors'
  const tabActive = `${tabBase} bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900`
  const tabIdle = `${tabBase} text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800" role="tablist" aria-label="Preview view">
          <button type="button" role="tab" aria-selected={view === 'card'} onClick={() => setView('card')} className={view === 'card' ? tabActive : tabIdle}>{isFeatured ? 'Featured card' : 'Card'}</button>
          <button type="button" role="tab" aria-selected={view === 'article'} onClick={() => setView('article')} className={view === 'article' ? tabActive : tabIdle}>Full article</button>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {view === 'article' ? 'As read at /news/…' : isFeatured ? 'Full width at the top of /news' : 'In the /news grid'}
        </span>
      </div>
      {/* Card views are zoomed out so they fit the panel without scrolling; the article view keeps reading size. */}
      <div className="rounded-xl bg-background p-4 ring-1 ring-brand-dark/10" style={view === 'card' ? { zoom: 0.72 } : undefined}>
        {view === 'article' ? (
          <ArticlePreview title={displayTitle} bodyHtml={bodyHtml} category={category} date={date} coverUrl={coverUrl} hasTitle={hasTitle} />
        ) : isFeatured ? (
          <FeaturedCardPreview title={displayTitle} excerpt={excerpt} category={category} date={date} coverUrl={coverUrl} />
        ) : (
          <StandardCardPreview title={displayTitle} excerpt={excerpt} category={category} date={date} coverUrl={coverUrl} />
        )}
      </div>
    </div>
  )
}
