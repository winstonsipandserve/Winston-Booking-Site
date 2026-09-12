import Image from 'next/image'
import Link from 'next/link'
import { CalendarIcon } from '@/components/ui/Icons'
import { NEWS_CATEGORY_LABELS } from '@/lib/news'
import type { NewsItem } from './NewsGrid'

function CategoryBadge({ item }: { item: NewsItem }) {
  return (
    <span className="inline-flex rounded-full bg-brand-dark px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wide text-brand-light">
      {NEWS_CATEGORY_LABELS[item.category]}
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

export default function NewsCard({ item, objectPosition = 'center', variant = 'standard' }: {
  item: NewsItem
  objectPosition?: string
  variant?: 'standard' | 'featured'
}) {
  if (variant === 'featured') {
    return (
      <article className="overflow-hidden rounded-card border border-brand-dark/15 bg-brand-light shadow-card">
        <Link href={`/news/${item.slug}`} className="group flex flex-col lg:min-h-[22rem] lg:flex-row">
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-brand-dark/5 lg:aspect-auto lg:w-[45%]">
            {item.coverImageUrl ? (
              <Image src={item.coverImageUrl} alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-105" style={{ objectPosition }} />
            ) : (
              <div className="flex h-full min-h-64 items-center justify-center font-serif text-5xl text-brand-dark/20" aria-hidden="true">W</div>
            )}
          </div>
          <div className="flex flex-1 flex-col p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-3"><CategoryBadge item={item} /><span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-accent-primary">Featured</span></div>
            <h2 className="mt-4 font-serif text-2xl leading-tight text-brand-dark transition-colors group-hover:text-accent-primary md:text-3xl">{item.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700 md:text-base">{item.preview}</p>
            <div className="mt-auto flex items-center justify-between gap-4 pt-8"><PostedDate date={item.date} /><span className="text-sm font-semibold text-accent-primary">Read article →</span></div>
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className="h-full overflow-hidden rounded-card border border-brand-dark/15 bg-brand-light shadow-card">
      <Link href={`/news/${item.slug}`} className="group flex h-full flex-col">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-brand-dark/5">
          {item.coverImageUrl ? (
            <Image src={item.coverImageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-105" style={{ objectPosition }} />
          ) : (
            <div className="flex h-full items-center justify-center font-serif text-4xl text-brand-dark/20" aria-hidden="true">W</div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-6">
          <CategoryBadge item={item} />
          <h3 className="mt-4 font-serif text-xl leading-snug text-brand-dark transition-colors group-hover:text-accent-primary">{item.title}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-700">{item.preview}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-6"><PostedDate date={item.date} /><span className="text-sm font-semibold text-accent-primary">Read →</span></div>
        </div>
      </Link>
    </article>
  )
}
