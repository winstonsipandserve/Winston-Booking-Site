import Reveal from '@/components/ui/Reveal'
import { formatCentavos } from '@/lib/format'

interface Tier {
  name: string
  totalCentavos: number
  activationCentavos: number
  creditCentavos: number
}

const TIERS: Tier[] = [
  { name: '3-Month', totalCentavos: 550000, activationCentavos: 200000, creditCentavos: 350000 },
  { name: '6-Month', totalCentavos: 1250000, activationCentavos: 600000, creditCentavos: 650000 },
  { name: '12-Month', totalCentavos: 2250000, activationCentavos: 1050000, creditCentavos: 1200000 },
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

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {TIERS.map((tier, index) => (
            <Reveal key={tier.name} delayMs={index * 100}>
              <div className="flex h-full flex-col rounded-2xl border border-brand-dark/10 bg-brand-light p-6 shadow-card">
                <h3 className="font-serif text-xl text-brand-dark">{tier.name}</h3>
                <p className="mt-3 font-serif text-4xl text-brand-dark">
                  {formatCentavos(tier.totalCentavos)}
                </p>
                <p className="mt-2 text-sm text-neutral-700">
                  {formatCentavos(tier.activationCentavos)} activation +{' '}
                  {formatCentavos(tier.creditCentavos)} F&amp;B credit
                </p>

                <ul className="mt-6 flex flex-col gap-2">
                  {PERKS.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-neutral-700">
                      <span className="mt-0.5 text-accent-primary" aria-hidden="true">
                        &#10003;
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
