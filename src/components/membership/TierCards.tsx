import Reveal from '@/components/ui/Reveal'
import { formatCentavos } from '@/lib/format'
import { CheckIcon } from '@/components/ui/Icons'

interface Tier {
  name: string
  totalCentavos: number
  activationCentavos: number
  creditCentavos: number
  monthCount: number
  featured?: boolean
}

const TIERS: Tier[] = [
  { name: '3-Month', totalCentavos: 550000, activationCentavos: 200000, creditCentavos: 350000, monthCount: 3 },
  {
    name: '6-Month',
    totalCentavos: 1250000,
    activationCentavos: 600000,
    creditCentavos: 650000,
    monthCount: 6,
    featured: true,
  },
  { name: '12-Month', totalCentavos: 2250000, activationCentavos: 1050000, creditCentavos: 1200000, monthCount: 12 },
]

const PERKS = [
  'Priority bookings',
  'Full facility use',
  'F&B credit usable at the café & bar',
  'Exclusive event access',
]

export default function TierCards() {
  return (
    <section className="bg-background py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">Plans</p>
            <h2 className="mt-4 font-serif text-4xl text-brand-dark md:text-5xl">
              Choose Your Membership
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 md:items-start">
          {TIERS.map((tier, index) => {
            const perMonthCentavos = Math.round(tier.totalCentavos / tier.monthCount / 100) * 100

            return (
              <Reveal key={tier.name} delayMs={index * 100}>
                <div
                  className={
                    tier.featured
                      ? 'relative flex h-full flex-col rounded-2xl border-2 border-accent-primary bg-brand-light p-6 shadow-xl shadow-brand-dark/10 md:scale-105'
                      : 'flex h-full flex-col rounded-2xl border border-brand-dark/10 bg-brand-light p-6 shadow-card'
                  }
                >
                  {tier.featured && (
                    <span className="absolute -top-3 left-6 rounded-full bg-accent-primary px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-light">
                      Most Popular
                    </span>
                  )}

                  <h3 className="font-serif text-xl text-brand-dark">{tier.name}</h3>
                  <p className="mt-3 font-serif text-4xl text-brand-dark">
                    {formatCentavos(tier.totalCentavos)}
                  </p>
                  <p className="mt-1 text-sm text-brand-dark/60">
                    ≈{formatCentavos(perMonthCentavos)}/mo
                  </p>
                  <p className="mt-2 text-sm text-neutral-700">
                    {formatCentavos(tier.activationCentavos)} activation +{' '}
                    {formatCentavos(tier.creditCentavos)} F&amp;B credit
                  </p>

                  <ul className="mt-6 flex flex-col gap-3">
                    {PERKS.map((perk) => (
                      <li key={perk} className="flex items-start gap-3 text-sm text-neutral-700">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                          <CheckIcon className="h-3 w-3" />
                        </span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
