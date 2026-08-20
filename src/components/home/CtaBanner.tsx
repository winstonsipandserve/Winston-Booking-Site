import Link from 'next/link'
import Sunburst from '@/components/ui/Sunburst'

export default function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark to-brand-mid py-24 md:py-28">
      <Sunburst
        lines={72}
        className="pointer-events-none absolute -right-56 top-1/2 h-[700px] w-[700px] -translate-y-1/2 text-accent-light/[0.16] md:-right-64 md:h-[1000px] md:w-[1000px]"
      />

      <div className="relative mx-auto max-w-6xl px-6 md:px-10">
        <div className="max-w-xl">
          <h2 className="font-serif text-4xl text-brand-light md:text-5xl">Ready to Play?</h2>
          <p className="mt-4 max-w-md text-brand-light/85">
            Reserve a court, grab a seat at the bar, or see what membership unlocks — your next
            game is a couple of taps away.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/book"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-primary to-brand-mid px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light shadow-lg shadow-accent-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
            >
              Book Now
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/membership"
              className="group relative isolate inline-flex items-center justify-center overflow-hidden rounded-full border border-brand-light px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-accent-primary to-brand-mid opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              Explore Membership
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
