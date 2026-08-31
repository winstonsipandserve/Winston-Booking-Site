import Image from 'next/image'
import { CalendarIcon } from '@/components/ui/Icons'
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
}

export default function NewsCard({ item, objectPosition = 'center' }: NewsCardProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-dark/10 bg-brand-light shadow-card">
      {item.image && (
        <div className="group relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            style={{ objectPosition }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-brand-dark/5 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full bg-accent-primary px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-light">
            {item.category}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        {!item.image && (
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-accent-primary px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-light">
              {item.category}
            </span>
          </div>
        )}
        <h3 className="font-serif text-lg text-brand-dark">{item.title}</h3>

        {item.affectedFacility && (
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-brand-dark/60">
            Affects: {item.affectedFacility}
          </p>
        )}

        <div className="mt-2">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-dark/60">Description</p>
          <p className="mt-1 text-sm text-neutral-700">{item.body}</p>
        </div>

        {item.impact && (
          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-dark/60">Impact</p>
            <p className="mt-1 text-sm text-neutral-700">{item.impact}</p>
          </div>
        )}

        {item.action && (
          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-dark/60">Action</p>
            <p className="mt-1 text-sm text-neutral-700">{item.action}</p>
          </div>
        )}

        {(item.eventStartAt || item.eventEndAt) && (
          <p className="mt-3 text-sm text-neutral-700">
            {item.eventStartAt}
            {item.eventStartAt && item.eventEndAt && ' – '}
            {item.eventEndAt}
          </p>
        )}

        <div className="mt-4 flex items-center gap-1.5 text-xs uppercase tracking-wide text-brand-dark/60">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>{item.date}</span>
        </div>

        {item.ctaLabel && item.ctaUrl && (
          <a
            href={item.ctaUrl}
            className="mt-4 inline-flex items-center justify-center gap-2 self-start rounded-none bg-accent-primary px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            {item.ctaLabel}
          </a>
        )}

        {item.socialUrl && item.socialPlatform && (
          <a
            href={item.socialUrl}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-accent-primary transition-colors hover:text-brand-mid"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d={SOCIAL_ICON_PATHS[item.socialPlatform]} />
            </svg>
            <span>{SOCIAL_LABELS[item.socialPlatform]}</span>
          </a>
        )}
      </div>
    </div>
  )
}
