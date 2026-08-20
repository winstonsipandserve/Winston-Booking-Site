import Link from 'next/link'
import Reveal from '@/components/ui/Reveal'
import Sunburst from '@/components/ui/Sunburst'
import { CocktailIcon } from '@/components/ui/Icons'

interface MembershipTier {
  label: string
  priceCentavos: number
  activationCentavos: number
  creditCentavos: number
}

const TIERS: MembershipTier[] = [
  { label: '3-Month', priceCentavos: 550000, activationCentavos: 200000, creditCentavos: 350000 },
  { label: '6-Month', priceCentavos: 1250000, activationCentavos: 600000, creditCentavos: 650000 },
  { label: '12-Month', priceCentavos: 2250000, activationCentavos: 1050000, creditCentavos: 1200000 },
]

function formatWholePesos(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH')}`
}

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

          <div className="mt-14 grid w-full grid-cols-1 gap-5 sm:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.label}
                className="rounded-2xl border border-brand-light/15 bg-brand-light/5 p-6 text-left"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-accent-light/90">{tier.label}</p>
                <p className="mt-3 font-serif text-3xl text-brand-light">
                  {formatWholePesos(tier.priceCentavos)}
                </p>
                <p className="mt-3 text-sm text-brand-light/70">
                  {formatWholePesos(tier.activationCentavos)} activation +{' '}
                  {formatWholePesos(tier.creditCentavos)} F&amp;B credit
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-xl text-sm text-brand-light/70">
            Members get exclusive access to the Speakeasy, plus F&amp;B credit that carries straight to
            the bar tab.
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
