'use client'

import { useRouter, useSearchParams } from 'next/navigation'
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
  const pillBase = 'rounded-full px-4 py-2 text-xs font-medium transition-colors'
  const pillActive = `${pillBase} bg-gray-900 text-white`
  const pillIdle = `${pillBase} border border-gray-300 text-gray-600 hover:border-gray-500`

  return (
    <>
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
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
            <p className="text-xs text-gray-400">
              {filteredItems.length} {filteredItems.length === 1 ? 'post' : 'posts'}
            </p>
          </div>
        </div>
      </div>

      <section className="bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          {filteredItems.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              {items.length === 0 ? 'No news has been published yet.' : 'No news in this category yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
