'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Reveal from '@/components/ui/Reveal'
import { NEWS_CATEGORIES, NEWS_CATEGORY_LABELS } from '@/lib/news'
import NewsCard from './NewsCard'

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

export interface NewsItem {
  id: string
  slug: string
  category: NewsCategory
  title: string
  preview: string
  date: string
  coverImageUrl: string | null
  isFeatured: boolean
}

const OBJECT_POSITIONS = ['center', 'top', '20% 70%', 'right']

function isNewsCategory(value: string | null): value is NewsCategory {
  return value !== null && (NEWS_CATEGORIES as readonly string[]).includes(value)
}

export default function NewsGrid({ items }: { items: NewsItem[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const selectedCategory: NewsCategory | 'all' = isNewsCategory(categoryParam) ? categoryParam : 'all'

  function handleSelectCategory(category: NewsCategory | 'all') {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') params.delete('category')
    else params.set('category', category)
    const query = params.toString()
    router.replace(query ? `/news?${query}` : '/news', { scroll: false })
  }

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter((item) => item.category === selectedCategory)
  const featured = filteredItems.find((item) => item.isFeatured)
  const gridItems = featured ? filteredItems.filter((item) => item.id !== featured.id) : filteredItems
  const pillBase = 'rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors'
  const pillActive = `${pillBase} bg-accent-primary text-brand-light`
  const pillIdle = `${pillBase} border border-brand-dark/20 text-brand-dark hover:border-accent-primary`

  return (
    <>
      <div className="border-b border-brand-dark/10 bg-brand-light">
        <div className="mx-auto max-w-6xl px-6 py-5 md:px-10">
          <div className="flex flex-wrap gap-2" aria-label="Filter news by category">
            <button type="button" onClick={() => handleSelectCategory('all')} className={selectedCategory === 'all' ? pillActive : pillIdle}>
              All
            </button>
            {NEWS_CATEGORIES.map((category) => (
              <button key={category} type="button" onClick={() => handleSelectCategory(category)} className={selectedCategory === category ? pillActive : pillIdle}>
                {NEWS_CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
          <p className="mt-3 text-right font-mono text-xs text-brand-dark/50">
            {filteredItems.length} {filteredItems.length === 1 ? 'post' : 'posts'}
          </p>
        </div>
      </div>

      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          {filteredItems.length === 0 ? (
            <p className="text-center text-sm text-neutral-700">
              {items.length === 0 ? 'No news has been published yet.' : 'No news in this category yet.'}
            </p>
          ) : (
            <div className="space-y-8">
              {featured && <Reveal><NewsCard item={featured} variant="featured" /></Reveal>}
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {gridItems.map((item, index) => (
                  <Reveal key={item.id} delayMs={(index + (featured ? 1 : 0)) * 100}>
                    <NewsCard item={item} objectPosition={OBJECT_POSITIONS[index % OBJECT_POSITIONS.length]} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
