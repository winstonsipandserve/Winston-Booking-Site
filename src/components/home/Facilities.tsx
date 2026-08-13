import Image from 'next/image'
import Reveal from '@/components/ui/Reveal'

interface FacilityTile {
  label: string
  large?: boolean
}

const FACILITIES: FacilityTile[] = [
  { label: 'Tennis Courts', large: true },
  { label: 'Pickleball Courts' },
  { label: 'Golf Simulator' },
  { label: 'Café & Bar' },
  { label: 'Speakeasy Lounge' },
]

const objectPositions = ['center', 'top', '20% 70%', 'right', 'bottom']
const tintColors = ['bg-brand-dark', 'bg-accent-primary', 'bg-brand-mid', 'bg-brand-dark', 'bg-accent-primary']

export default function Facilities() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <Reveal>
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-primary">
              OUR FACILITIES
            </span>
            <h2 className="mt-3 text-4xl font-semibold text-brand-dark">
              A Space Worth Playing In
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-xl text-gray-700">
              Modern, clean, and purpose-built for players and cafe guests alike.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:grid-rows-2 lg:h-[560px]">
          {FACILITIES.map((facility, index) => (
            <Reveal
              key={facility.label}
              delayMs={index * 100}
              className={
                facility.large
                  ? 'col-span-2 aspect-[4/3] lg:aspect-auto lg:col-span-2 lg:row-span-2 lg:h-full'
                  : 'aspect-square lg:aspect-auto lg:h-full'
              }
            >
              <div className="group relative h-full w-full overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-hero">
                <Image
                  src="/images/placeholder.jpg"
                  alt={facility.label}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{ objectPosition: objectPositions[index % objectPositions.length] }}
                />
                <div
                  className={`pointer-events-none absolute inset-0 opacity-10 ${
                    tintColors[index % tintColors.length]
                  }`}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/10 to-transparent" />
                <p className="absolute bottom-4 left-4 text-lg font-medium text-white">
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
