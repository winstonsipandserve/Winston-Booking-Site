'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Reveal from '@/components/ui/Reveal'
import { CATEGORY_LABELS } from '@/lib/bulletin-validation'
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

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as NewsCategory[]

function isNewsCategory(value: string | null): value is NewsCategory {
  return value !== null && (CATEGORY_KEYS as string[]).includes(value)
}

interface NewsGridProps {
  items: NewsItem[]
}

export default function NewsGrid({ items }: NewsGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const selectedCategory: NewsCategory | 'All' = isNewsCategory(categoryParam) ? categoryParam : 'All'

  function handleSelectCategory(category: NewsCategory | 'All') {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'All') {
      params.delete('category')
    } else {
      params.set('category', category)
    }
    const query = params.toString()
    router.replace(query ? `/news?${query}` : '/news', { scroll: false })
  }

  const filteredItems =
    selectedCategory === 'All' ? items : items.filter((item) => item.category === selectedCategory)

  return (
    <section className="bg-background py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="mb-10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSelectCategory('All')}
            className={
              selectedCategory === 'All'
                ? 'rounded-full bg-accent-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-brand-light'
                : 'rounded-full border border-brand-dark/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-brand-dark transition-colors hover:border-accent-primary'
            }
          >
            All
          </button>
          {(Object.keys(CATEGORY_LABELS) as NewsCategory[]).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleSelectCategory(category)}
              className={
                selectedCategory === category
                  ? 'rounded-full bg-accent-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-brand-light'
                  : 'rounded-full border border-brand-dark/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-brand-dark transition-colors hover:border-accent-primary'
              }
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <p className="text-center text-sm text-neutral-700">
            {items.length === 0
              ? 'No announcements yet — check back soon.'
              : 'No announcements in this category yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, index) => (
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
