import Image from 'next/image'
import Link from 'next/link'
import { BUSINESS_OPEN_HOUR, BUSINESS_CLOSE_HOUR } from '@/lib/business-hours'

interface HeroProps {
  totalResources: number
  sportCount: number
}

function formatHour12(hour: number): string {
  if (hour === 0) return '12AM'
  if (hour === 12) return '12PM'
  if (hour < 12) return `${hour}AM`
  return `${hour - 12}PM`
}

export default function Hero({ totalResources, sportCount }: HeroProps) {
  const stats = [
    { label: 'Sports', value: `${sportCount}` },
    { label: 'Courts & Simulators', value: `${totalResources}` },
    { label: 'Opens', value: formatHour12(BUSINESS_OPEN_HOUR) },
    { label: 'Last Booking', value: formatHour12(BUSINESS_CLOSE_HOUR) },
  ]

  return (
    <section className="bg-cream">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-block rounded-full bg-accent-light px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-mid">
            EST. 2026 · EAST FAIRVIEW PARK SUBDIVISION
          </span>

          <h1 className="mt-6 text-5xl font-semibold leading-tight sm:text-7xl">
            <span className="block text-brand-dark">Sip. Serve.</span>
            <span className="block text-accent">Play. Repeat.</span>
          </h1>

          <p className="mt-6 max-w-lg text-xl text-gray-600">
            Tennis, pickleball, and golf simulation — paired with craft coffee and a
            members-only speakeasy bar.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/book"
              className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-mid"
            >
              Book a Court →
            </Link>
            <Link
              href="/cafe-bar"
              className="rounded-xl border border-brand-mid px-6 py-3 text-base font-medium text-brand-dark transition-all duration-200 hover:bg-accent-light"
            >
              Explore the Cafe
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-semibold text-brand-dark">{stat.value}</p>
                <p className="text-xs text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-hero">
          <Image
            src="/images/placeholder.jpg"
            alt="Winston Sip & Serve facility"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  )
}
