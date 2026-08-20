import Reveal from '@/components/ui/Reveal'
import NewsCard from './NewsCard'

export type NewsCategory = 'Renovation' | 'Closure' | 'Tournament' | 'Community'

export interface NewsItem {
  id: string
  category: NewsCategory
  title: string
  excerpt: string
  date: string // display string, e.g. "August 2026" — not a real ISO timestamp requirement yet
  image: string // '/images/placeholder.jpg', varied objectPosition per item
  socialPlatform?: 'instagram' | 'facebook'
  socialUrl?: string // always '#' in this pass — real post URLs not yet available
}

// SAMPLE CONTENT — these are placeholder announcements for layout purposes only,
// not real facility events. Replace with real posts once the admin News/Bulletin
// CRUD is built. socialUrl is '#' everywhere until real post links are provided.
const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'courts-resurfacing',
    category: 'Renovation',
    title: 'Courts Getting a Fresh Coat',
    excerpt:
      "We're resurfacing two pickleball courts this month — expect limited availability on those courts while work is underway.",
    date: 'August 2026',
    image: '/images/placeholder.jpg',
    socialPlatform: 'instagram',
    socialUrl: '#',
  },
  {
    id: 'fall-pickleball-open',
    category: 'Tournament',
    title: 'Fall Pickleball Open — Sign-Ups Open',
    excerpt:
      'Our first in-house pickleball tournament kicks off this fall. Singles and doubles brackets, open to members and non-members.',
    date: 'September 2026',
    image: '/images/placeholder.jpg',
    socialPlatform: 'facebook',
    socialUrl: '#',
  },
  {
    id: 'holiday-hours',
    category: 'Closure',
    title: 'Holiday Hours Notice',
    excerpt:
      "We'll be closed on select holidays this year — check here for the full schedule before you book.",
    date: 'Ongoing',
    image: '/images/placeholder.jpg',
  },
  {
    id: 'new-baristas',
    category: 'Community',
    title: 'New Baristas Behind the Counter',
    excerpt:
      'Say hello to two new faces at the café bar, both trained in specialty espresso and looking forward to meeting regulars.',
    date: 'August 2026',
    image: '/images/placeholder.jpg',
    socialPlatform: 'instagram',
    socialUrl: '#',
  },
]

const OBJECT_POSITIONS = ['center', 'top', '20% 70%', 'right']

export default function NewsGrid() {
  return (
    <section className="bg-background py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {NEWS_ITEMS.map((item, index) => (
            <Reveal key={item.id} delayMs={index * 100}>
              <NewsCard item={item} objectPosition={OBJECT_POSITIONS[index % OBJECT_POSITIONS.length]} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
