import Image from 'next/image'
import { CalendarIcon } from '@/components/ui/Icons'
import { CATEGORY_LABELS } from '@/lib/bulletin-validation'
import type { NewsItem } from './NewsGrid'

// Icon paths copied verbatim from src/components/ui/SocialIcons.tsx (Facebook/Instagram
// entries) — that component always renders both icons in a row, so a single-platform
// icon isn't available from it directly; reusing the same path data rather than
// hand-authoring new icons per the task's instruction.
const SOCIAL_ICON_PATHS = {
  facebook:
    'M13.5 9H15V6.5h-1.75C11.2 6.5 10 7.7 10 9.75V11H8.5v2.5H10V18h2.5v-4.5H14l.5-2.5h-2v-1c0-.6.2-1 1-1Z',
  instagram:
    'M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm4 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm4.5-3.25a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z',
}

const SOCIAL_LABELS = {
  facebook: 'View on Facebook',
  instagram: 'View on Instagram',
}

interface NewsCardProps {
  item: NewsItem
  objectPosition?: string
  variant?: 'standard' | 'featured'
}

function CategoryBadge({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-brand-dark px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wide text-brand-light ${className}`}
    >
      {label}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[4rem_1fr] gap-4 border-t border-brand-dark/10 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <dt className="font-mono text-[0.65rem] uppercase tracking-wide text-brand-dark/50">{label}</dt>
      <dd className="text-sm leading-relaxed text-neutral-700">{value}</dd>
    </div>
  )
}

function PostedDate({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-xs text-brand-dark/50">
      <CalendarIcon className="h-3.5 w-3.5" />
      <span>{date}</span>
    </div>
  )
}

function CtaButton({ label, href, className = '' }: { label: string; href: string; className?: string }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center rounded-none bg-accent-primary px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${className}`}
    >
      {label}
    </a>
  )
}

function SocialLink({
  platform,
  href,
  className = '',
}: {
  platform: 'facebook' | 'instagram'
  href: string
  className?: string
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 text-sm font-medium text-brand-mid transition-colors hover:text-accent-primary ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d={SOCIAL_ICON_PATHS[platform]} />
      </svg>
      <span>{SOCIAL_LABELS[platform]}</span>
    </a>
  )
}

function eventRange(item: NewsItem): string | null {
  if (!item.eventStartAt && !item.eventEndAt) return null
  if (item.eventStartAt && item.eventEndAt) return `${item.eventStartAt} – ${item.eventEndAt}`
  return item.eventStartAt ?? item.eventEndAt ?? null
}

export default function NewsCard({ item, objectPosition = 'center', variant = 'standard' }: NewsCardProps) {
  const categoryLabel = CATEGORY_LABELS[item.category]
  const event = eventRange(item)
  const hasDetails = Boolean(item.impact || item.action)

  if (variant === 'featured') {
    return (
      <article className="flex flex-col overflow-hidden rounded-card border border-brand-dark/15 bg-brand-light shadow-card lg:min-h-[22rem] lg:flex-row">
        {item.image && (
          <div className="group relative aspect-[4/3] w-full shrink-0 overflow-hidden lg:aspect-auto lg:w-[45%]">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              style={{ objectPosition }}
            />
            <CategoryBadge label={categoryLabel} className="absolute left-5 top-5" />
          </div>
        )}

        <div className="flex flex-1 flex-col p-6 md:p-10">
          {!item.image && <CategoryBadge label={categoryLabel} className="mb-4 self-start" />}
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-accent-primary">
            Featured
          </span>
          <h2 className="mt-3 font-serif text-2xl leading-tight text-brand-dark md:text-3xl">{item.title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700 md:text-base">{item.body}</p>

          {event && (
            <p className="mt-5 self-start border-l-4 border-brand-mid bg-accent-light px-4 py-2 text-sm font-medium text-brand-dark">
              {event}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            {item.ctaLabel && item.ctaUrl && <CtaButton label={item.ctaLabel} href={item.ctaUrl} />}
            {item.socialUrl && item.socialPlatform && (
              <SocialLink platform={item.socialPlatform} href={item.socialUrl} />
            )}
            <PostedDate date={item.date} />
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-brand-dark/15 bg-brand-light shadow-card">
      {item.image && (
        <div className="group relative aspect-[4/3] w-full shrink-0 overflow-hidden">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            style={{ objectPosition }}
          />
          <CategoryBadge label={categoryLabel} className="absolute left-4 top-4" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        {!item.image && <CategoryBadge label={categoryLabel} className="mb-4 self-start" />}

        <h3 className="font-serif text-xl leading-snug text-brand-dark">{item.title}</h3>

        {item.affectedFacility && (
          <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-wide text-accent-primary">
            Affects: {item.affectedFacility}
          </p>
        )}

        <p className="mt-3 text-sm leading-relaxed text-neutral-700">{item.body}</p>

        {item.discountSummary && (
          <p className="mt-4 bg-accent-light px-4 py-3 text-sm font-medium text-accent-primary">
            {item.discountSummary}
            {item.promoCode && ` — Code: ${item.promoCode}`}
          </p>
        )}

        {event && <p className="mt-4 text-sm font-medium text-brand-mid">{event}</p>}

        {hasDetails && (
          <dl className="mt-5 border-t border-brand-dark/10 pt-4">
            {item.impact && <DetailRow label="Impact" value={item.impact} />}
            {item.action && <DetailRow label="Action" value={item.action} />}
          </dl>
        )}

        <div className="mt-auto flex flex-col gap-4 pt-6">
          <PostedDate date={item.date} />
          {item.ctaLabel && item.ctaUrl && (
            <CtaButton label={item.ctaLabel} href={item.ctaUrl} className="self-start" />
          )}
          {item.socialUrl && item.socialPlatform && (
            <SocialLink platform={item.socialPlatform} href={item.socialUrl} className="self-start" />
          )}
        </div>
      </div>
    </article>
  )
}
