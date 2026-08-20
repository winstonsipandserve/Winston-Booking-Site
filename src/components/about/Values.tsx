import Reveal from '@/components/ui/Reveal'
import { BullseyeIcon, CoffeeCupIcon, GuestsIcon } from '@/components/ui/Icons'

const VALUES = [
  {
    title: 'Play',
    Icon: BullseyeIcon,
    blurb:
      'Tennis, pickleball, and golf simulation for every level, from first-timers to seasoned competitors.',
  },
  {
    title: 'Craft',
    Icon: CoffeeCupIcon,
    blurb:
      'A café by day and a members-only speakeasy by night, built around genuine care for what’s in the cup and glass.',
  },
  {
    title: 'Community',
    Icon: GuestsIcon,
    blurb:
      'A gathering place for East Fairview — where regulars become friends and every visit feels like coming back to something familiar.',
  },
]

export default function Values() {
  return (
    <section className="bg-background py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {VALUES.map((value, index) => (
            <Reveal key={value.title} delayMs={index * 100}>
              <div className="flex flex-col items-start">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                  <value.Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-5 font-serif text-xl text-brand-dark">{value.title}</h3>
                <p className="mt-2 text-sm text-neutral-700">{value.blurb}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
