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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-start">
      {MEMBERSHIP_TIER_ORDER.map((tier) => {
        const plan = MEMBERSHIP_TIER_PLANS[tier]
        const featured = tier === 'premier'
        const showFounding = featured && foundingOpen
        const perks = [...systemPerks(tier), ...TIER_PERKS[tier]]
        if (showFounding) perks.push('Exclusive Founding Member merchandise')

        return (
          <div
            key={tier}
            className="relative flex h-full flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            {featured && (
              <span className="absolute -top-3 left-6 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                {showFounding ? 'Founding Member Offer' : 'Most Popular'}
              </span>
            )}

            <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
            {showFounding ? (
              <>
                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {formatWholePesos(FOUNDING_PREMIER_PRICE_CENTAVOS)}
                  <span className="text-base font-normal text-gray-500"> / year</span>
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  <span className="line-through">{formatWholePesos(plan.totalCentavos)}</span> for the
                  first {FOUNDING_MEMBER_CAP} Premier members · {foundingSeatsRemaining} seats left
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  This price covers your first year. Premier renews at the standard rate
                  after that — Founding status stays with you for life.
                </p>
              </>
            ) : (
              <p className="mt-3 text-3xl font-bold text-gray-900">
                {formatWholePesos(plan.totalCentavos)}
                <span className="text-base font-normal text-gray-500"> / year</span>
              </p>
            )}

            <ul className="mt-6 flex flex-col gap-3">
              {perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
