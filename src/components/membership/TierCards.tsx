import Reveal from '@/components/ui/Reveal'
import { formatWholePesos } from '@/lib/format'
import { CheckIcon } from '@/components/ui/Icons'
import {
  FOUNDING_MEMBER_CAP,
  FOUNDING_PREMIER_PRICE_CENTAVOS,
  MEMBERSHIP_TIER_ORDER,
  MEMBERSHIP_TIER_PLANS,
} from '@/lib/membership-pricing'
import type { MembershipTier } from '@prisma/client'

// Perk copy mirrors docs/business.md → Membership → Tiers. The system-enforced perks
// (window, passes, discount) are derived from MEMBERSHIP_TIER_PLANS so they can't drift.
const TIER_PERKS: Record<MembershipTier, string[]> = {
  player: [
    '50% off one court hour during your birthday month',
    'Access to member open plays, mixers & events',
  ],
  premier: [
    'Priority registration for tournaments, leagues & clinics',
    'Access to exclusive member events',
    '1 complimentary court hour during your birthday month',
    'Exclusive Winston welcome gift',
  ],
  elite: [
    'Highest-priority registration for tournaments, leagues & clinics',
    'Access to exclusive member events',
    '1 complimentary court hour during your birthday month',
    'Premium Winston merchandise',
  ],
}

function systemPerks(tier: MembershipTier): string[] {
  const plan = MEMBERSHIP_TIER_PLANS[tier]
  return [
    `${plan.advanceBookingDays}-day advance booking priority`,
    `${plan.guestPasses} complimentary guest passes per year`,
    `${plan.bookingDiscountPercent}% off court and simulator bookings`,
    '10% off Winston Sip & Serve',
  ]
}

interface TierCardsProps {
  /** Founding Member seats still open (docs/business.md → Founding Members). */
  foundingSeatsRemaining: number
}

export default function TierCards({ foundingSeatsRemaining }: TierCardsProps) {
  const foundingOpen = foundingSeatsRemaining > 0

  return (
    <section className="bg-background py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">Plans</p>
            <h2 className="mt-4 font-serif text-4xl text-brand-dark md:text-5xl">
              Choose Your Membership
            </h2>
            <p className="mt-4 text-neutral-700">
              Every plan runs for a full year. Your membership fee is the whole price — no hidden
              activation charges.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 md:items-start">
          {MEMBERSHIP_TIER_ORDER.map((tier, index) => {
            const plan = MEMBERSHIP_TIER_PLANS[tier]
            const featured = tier === 'premier'
            const showFounding = featured && foundingOpen
            const perks = [...systemPerks(tier), ...TIER_PERKS[tier]]
            if (showFounding) perks.push('Exclusive Founding Member merchandise')

            return (
              <Reveal key={tier} delayMs={index * 100}>
                <div
                  className={
                    featured
                      ? 'relative flex h-full flex-col rounded-card border-2 border-accent-primary bg-brand-light p-6 shadow-xl shadow-brand-dark/10 md:scale-105'
                      : 'flex h-full flex-col rounded-card border border-brand-dark/10 bg-brand-light p-6 shadow-card'
                  }
                >
                  {featured && (
                    <span className="absolute -top-3 left-6 rounded-full bg-accent-primary px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-light">
                      {showFounding ? 'Founding Member Offer' : 'Most Popular'}
                    </span>
                  )}

                  <h3 className="font-serif text-xl text-brand-dark">{plan.name}</h3>
                  {showFounding ? (
                    <>
                      <p className="mt-3 font-serif text-4xl text-brand-dark">
                        {formatWholePesos(FOUNDING_PREMIER_PRICE_CENTAVOS)}
                        <span className="text-base text-brand-dark/60"> / year</span>
                      </p>
                      <p className="mt-1 text-sm text-brand-dark/60">
                        <span className="line-through">{formatWholePesos(plan.totalCentavos)}</span> for the
                        first {FOUNDING_MEMBER_CAP} Premier members · {foundingSeatsRemaining} seats left
                      </p>
                      <p className="mt-2 text-sm text-neutral-700">
                        This price covers your first year. Premier renews at the standard rate
                        after that — Founding status stays with you for life.
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 font-serif text-4xl text-brand-dark">
                      {formatWholePesos(plan.totalCentavos)}
                      <span className="text-base text-brand-dark/60"> / year</span>
                    </p>
                  )}

                  <ul className="mt-6 flex flex-col gap-3">
                    {perks.map((perk) => (
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
