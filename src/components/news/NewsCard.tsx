import Image from 'next/image'
import Link from 'next/link'
import { CalendarIcon } from '@/components/ui/Icons'
import { NEWS_CATEGORY_LABELS } from '@/lib/news'
import type { NewsItem } from './NewsGrid'

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <Link href={`/news/${item.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gray-100">
          {item.coverImageUrl ? (
            <Image
              src={item.coverImageUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-gray-300" aria-hidden="true">
              W
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {NEWS_CATEGORY_LABELS[item.category]}
          </span>
          <h3 className="mt-3 text-lg font-semibold text-gray-900">{item.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-gray-500">{item.preview}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <CalendarIcon className="h-3.5 w-3.5" />
              {item.date}
            </span>
            <span className="text-sm font-medium text-gray-900">Read →</span>
          </div>
        </div>
      </Link>
    </article>
  )
}
