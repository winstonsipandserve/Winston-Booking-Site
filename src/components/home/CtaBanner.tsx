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
              className="rounded-full bg-accent-primary px-9 py-3.5 text-center text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark"
            >
              Book Now
            </Link>
            <Link
              href="/membership"
              className="rounded-full border border-brand-light px-9 py-3.5 text-center text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-brand-light hover:text-brand-dark"
            >
              Explore Membership
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
