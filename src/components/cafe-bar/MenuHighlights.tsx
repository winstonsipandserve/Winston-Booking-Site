import Image from 'next/image'
import Reveal from '@/components/ui/Reveal'
import { formatCentavos } from '@/lib/format'

interface MenuItem {
  name: string
  priceCentavos: number
  description: string
  image: string
}

interface MenuCategory {
  title: string
  items: MenuItem[]
}

const CATEGORIES: MenuCategory[] = [
  {
    title: 'Espresso',
    items: [
      {
        name: 'Café Americano',
        priceCentavos: 12500,
        description: 'Rich double shot, hot or over ice.',
        image: '/images/placeholder.jpg',
      },
      {
        name: 'Flat White',
        priceCentavos: 15000,
        description: 'Silky microfoam over a strong espresso base.',
        image: '/images/placeholder.jpg',
      },
    ],
  },
  {
    title: 'Specialty',
    items: [
      {
        name: 'Winston Barrel Brew',
        priceCentavos: 17000,
        description: 'Slow-steeped 14 hours, served tall over ice.',
        image: '/images/placeholder.jpg',
      },
      {
        name: 'Matcha Latte',
        priceCentavos: 18000,
        description: 'Ceremonial-grade matcha, steamed oat milk.',
        image: '/images/placeholder.jpg',
      },
    ],
  },
  {
    title: 'Bites',
    items: [
      {
        name: 'Winston Club',
        priceCentavos: 31000,
        description: 'Triple-stack sandwich, smoked ham, house aioli, fries.',
        image: '/images/placeholder.jpg',
      },
      {
        name: 'Tropical Bowl',
        priceCentavos: 25000,
        description: 'Yogurt, fresh fruit, granola, honey drizzle.',
        image: '/images/placeholder.jpg',
      },
      {
        name: 'Avocado Toast',
        priceCentavos: 27000,
        description: 'Sourdough, chili flakes, soft poached egg.',
        image: '/images/placeholder.jpg',
      },
      {
        name: 'Trail Mix Plate',
        priceCentavos: 20000,
        description: 'Roasted nuts, dried fruit, dark chocolate.',
        image: '/images/placeholder.jpg',
      },
    ],
  },
]

export default function MenuHighlights() {
  return (
    <section className="bg-background py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">On the Menu</p>
            <h2 className="mt-4 font-serif text-4xl text-brand-dark md:text-5xl">
              Something for Every Table
            </h2>
            <p className="mt-4 text-neutral-700">
              Open to players and visitors alike — grab a seat before your game, or stay after.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {CATEGORIES.map((category, categoryIndex) => (
            <Reveal key={category.title} delayMs={categoryIndex * 100}>
              <h3 className="font-serif text-xl text-brand-dark">{category.title}</h3>
              <div className="mt-5 flex flex-col gap-4">
                {category.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-4 rounded-card border border-brand-dark/10 bg-brand-light p-4 shadow-card"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-card-inline">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate font-serif text-base text-brand-dark">{item.name}</p>
                        <p className="shrink-0 text-sm font-medium text-accent-primary">
                          {formatCentavos(item.priceCentavos)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-neutral-700">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
