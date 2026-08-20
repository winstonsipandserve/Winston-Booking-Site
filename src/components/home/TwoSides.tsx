import Link from 'next/link'
import Reveal from '@/components/ui/Reveal'
import Sunburst from '@/components/ui/Sunburst'
import { BullseyeIcon, CoffeeCupIcon } from '@/components/ui/Icons'

export default function TwoSides() {
  return (
    <section className="bg-brand-light py-28 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">Two Sides, One Winston</p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:gap-x-12">
          <Reveal className="flex flex-col items-start">
            <BullseyeIcon className="h-8 w-8 text-brand-dark" />
            <h3 className="mt-5 font-serif text-3xl text-brand-dark md:text-4xl">On the Court</h3>
            <p className="mt-4 max-w-sm text-neutral-700">
              Tennis, pickleball, and golf simulation — courts and bays built for real games, not
              just casual knock-arounds.
            </p>
            <Link
              href="/book"
              className="mt-6 text-sm font-medium uppercase tracking-wide text-accent-primary transition-colors hover:text-brand-dark"
            >
              Book a Court →
            </Link>
          </Reveal>

          <div className="relative flex items-center justify-center py-10 md:py-0">
            <span aria-hidden="true" className="h-px w-full bg-brand-dark/10 md:h-full md:w-px" />
            <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-light">
              <Sunburst lines={20} className="absolute inset-0 h-full w-full text-accent-primary/25" />
              <span className="relative font-serif text-lg italic text-brand-dark">&</span>
            </div>
          </div>

          <Reveal delayMs={100} className="flex flex-col items-start md:items-end md:text-right">
            <CoffeeCupIcon className="h-8 w-8 text-brand-dark" />
            <h3 className="mt-5 font-serif text-3xl text-brand-dark md:text-4xl">At the Bar</h3>
            <p className="mt-4 max-w-sm text-neutral-700">
              Craft coffee by day, a members-only speakeasy by night — somewhere to land after the
              last point.
            </p>
            <Link
              href="/cafe-bar"
              className="mt-6 text-sm font-medium uppercase tracking-wide text-accent-primary transition-colors hover:text-brand-dark"
            >
              Visit the Café →
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
