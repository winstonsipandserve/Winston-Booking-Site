import Link from 'next/link'
import Sunburst from '@/components/ui/Sunburst'

export default function AboutCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark to-brand-mid py-24 md:py-28">
      <Sunburst
        lines={72}
        className="pointer-events-none absolute -right-56 top-1/2 h-[700px] w-[700px] -translate-y-1/2 text-accent-light/[0.16] md:-right-64 md:h-[1000px] md:w-[1000px]"
      />

      <div className="relative mx-auto max-w-6xl px-6 md:px-10">
        <div className="max-w-xl">
          <h2 className="font-serif text-4xl text-brand-light md:text-5xl">Come See For Yourself</h2>
          <p className="mt-4 max-w-md text-brand-light/85">
            Book a court or explore membership to make Winston part of your routine.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
            >
              Book a Court
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/membership"
              className="inline-flex items-center justify-center rounded-lg border border-brand-light px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:border-accent-primary hover:bg-accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
            >
              Become a Member
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
