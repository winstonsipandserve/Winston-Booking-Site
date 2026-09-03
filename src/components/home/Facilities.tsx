import Image from 'next/image'
import Reveal from '@/components/ui/Reveal'

interface FacilityTile {
  label: string
  large?: boolean
  image: string
}

// TEMPORARY: these are the shared placeholder.jpg copied 5x under public/images/facilities/,
// standing in for real venue photography — swap each file (or the `image` path per facility)
// once real photos are available.
const FACILITIES: FacilityTile[] = [
  { label: 'Tennis Courts', large: true, image: '/images/facilities/tennis-courts.jpg' },
  { label: 'Pickleball Courts', image: '/images/facilities/pickleball-courts.jpg' },
  { label: 'Golf Simulator', image: '/images/facilities/golf-simulator.jpg' },
  { label: 'Café & Bar', image: '/images/facilities/cafe-bar.jpg' },
  { label: 'Speakeasy Lounge', image: '/images/facilities/speakeasy-lounge.jpg' },
]

const objectPositions = ['center', 'top', '20% 70%', 'right', 'bottom']

export default function Facilities() {
  return (
    <section className="bg-background py-28 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">Our Facilities</p>
            <h2 className="mt-4 font-serif text-4xl text-brand-dark md:text-5xl">
              A Space Worth Playing In
            </h2>
            <p className="mt-4 text-neutral-700">
              From baseline rallies to fairway swings, every corner of Winston is built for how you
              move, and how you unwind after.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-4 md:h-[620px] md:grid-cols-4 md:grid-rows-2 md:gap-5">
          {FACILITIES.map((facility, index) => (
            <Reveal
              key={facility.label}
              delayMs={index * 100}
              className={
                facility.large
                  ? 'col-span-2 row-span-2 h-64 sm:h-80 md:h-full'
                  : 'h-40 sm:h-48 md:h-full'
              }
            >
              <div className="group relative h-full w-full overflow-hidden rounded-card">
                <Image
                  src={facility.image}
                  alt={facility.label}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  style={{ objectPosition: objectPositions[index % objectPositions.length] }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/10 to-transparent transition-opacity duration-500 group-hover:from-brand-dark/90" />
                <p className="absolute bottom-4 left-5 font-serif text-lg text-brand-light md:text-xl">
                  {facility.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
