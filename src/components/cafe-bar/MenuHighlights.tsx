import Reveal from '@/components/ui/Reveal'

interface MenuCategory {
  title: string
  description: string
}

const CATEGORIES: MenuCategory[] = [
  {
    title: 'Coffee & Espresso',
    description: 'Single-origin pour-overs, espresso classics, and cold brew for pre- or post-match fuel.',
  },
  {
    title: 'Cocktails & Spirits',
    description: 'House cocktails and a curated spirits list, poured with the same care as our courts are kept.',
  },
  {
    title: 'Bar Bites',
    description: 'Shareable plates built for lingering — order a round, then order another.',
  },
  {
    title: 'Non-Alcoholic',
    description: 'Mocktails, sodas, and fresh juices for anyone sitting this round out.',
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

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category, index) => (
            <Reveal key={category.title} delayMs={index * 100}>
              <div className="h-full rounded-2xl border border-brand-dark/10 bg-brand-light p-6 shadow-card">
                <h3 className="font-serif text-xl text-brand-dark">{category.title}</h3>
                <p className="mt-3 text-sm text-neutral-700">{category.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
