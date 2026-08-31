import Reveal from '@/components/ui/Reveal'
import NewsCard from './NewsCard'

export type NewsCategory =
  | 'Renovation'
  | 'Closure'
  | 'Tournament'
  | 'Community'
  | 'General'
  | 'FacilityMaintenance'

export interface NewsItem {
  id: string
  category: NewsCategory
  title: string
  excerpt: string
  body: string
  date: string // display string, e.g. "August 2026" — not a real ISO timestamp requirement yet
  image: string | null // null when the bulletin's category doesn't require one
  socialPlatform?: 'instagram' | 'facebook'
  socialUrl?: string // always '#' in this pass — real post URLs not yet available
  affectedFacility?: string
  impact?: string
  action?: string
  eventStartAt?: string // pre-formatted display string
  eventEndAt?: string // pre-formatted display string
  ctaLabel?: string
  ctaUrl?: string
}

const OBJECT_POSITIONS = ['center', 'top', '20% 70%', 'right']

interface NewsGridProps {
  items: NewsItem[]
}

export default function NewsGrid({ items }: NewsGridProps) {
  return (
    <section className="bg-background py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        {items.length === 0 ? (
          <p className="text-center text-sm text-neutral-700">No announcements yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <Reveal key={item.id} delayMs={index * 100}>
                <NewsCard item={item} objectPosition={OBJECT_POSITIONS[index % OBJECT_POSITIONS.length]} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
