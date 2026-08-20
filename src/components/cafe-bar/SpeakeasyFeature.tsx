import Link from 'next/link'
import Reveal from '@/components/ui/Reveal'
import Sunburst from '@/components/ui/Sunburst'
import { CocktailIcon } from '@/components/ui/Icons'

export default function SpeakeasyFeature() {
  return (
    <section className="relative overflow-hidden bg-brand-dark py-24 md:py-28">
      <Sunburst
        lines={64}
        className="pointer-events-none absolute -left-48 top-1/2 h-[600px] w-[600px] -translate-y-1/2 text-accent-light/[0.12] md:h-[900px] md:w-[900px]"
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center md:px-10">
        <Reveal className="flex flex-col items-center">
          <CocktailIcon className="h-9 w-9 text-accent-light" />

          <span className="mt-5 inline-flex items-center rounded-full border border-accent-primary px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-accent-primary">
            Members-Only
          </span>

          <h2 className="mt-6 font-serif text-4xl text-brand-light md:text-5xl">The Speakeasy Lounge</h2>

          <p className="mt-4 max-w-xl text-brand-light/80">
            After hours, Winston shifts into a quieter, members-only lounge — low light, a
            tighter cocktail list, and a room built for winding down.
          </p>

          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-accent-light/90">
            Evening hours — details coming soon.
          </p>

          <Link
            href="/membership"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent-primary px-8 py-3 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            Explore Membership
            <span aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
