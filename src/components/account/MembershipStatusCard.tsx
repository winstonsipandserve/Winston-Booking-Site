import { formatCentavos } from '@/lib/format'
import { CheckIcon } from '@/components/ui/Icons'

// SAMPLE CONTENT — hardcoded placeholder membership status for this frontend-only pass.
// Replace once member auth (Auth.js session tied to Customer/Membership) is wired.
const SAMPLE_MEMBERSHIP = {
  tierName: '6-Month',
  activationCentavos: 600000,
  creditCentavos: 650000,
  remainingCreditCentavos: 420000,
  expiryDate: 'February 15, 2027',
}

// Perks copied verbatim from PROJECT_CONTEXT.md's Membership Tiers → Perks line.
const PERKS = ['Priority bookings', 'Facility use', 'Complimentary F&B (via credit)', 'Exclusive event access']

export default function MembershipStatusCard() {
  return (
    <div className="flex flex-col rounded-2xl border-2 border-accent-primary bg-brand-light px-6 py-6 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-xl text-brand-dark">Membership Status</h2>
        <span className="rounded-full bg-accent-primary px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-light">
          {SAMPLE_MEMBERSHIP.tierName}
        </span>
      </div>

      <p className="mt-3 text-sm text-neutral-700">
        {formatCentavos(SAMPLE_MEMBERSHIP.activationCentavos)} activation +{' '}
        {formatCentavos(SAMPLE_MEMBERSHIP.creditCentavos)} F&amp;B credit
      </p>

      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-brand-dark/10 pt-4">
        <span className="text-brand-dark/70">Remaining credit</span>
        <span className="text-xl font-medium text-accent-primary">
          {formatCentavos(SAMPLE_MEMBERSHIP.remainingCreditCentavos)} of{' '}
          {formatCentavos(SAMPLE_MEMBERSHIP.creditCentavos)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 border-t border-brand-dark/10 pt-3">
        <span className="text-brand-dark/70">Expires</span>
        <span className="font-medium text-brand-dark">{SAMPLE_MEMBERSHIP.expiryDate}</span>
      </div>

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
  )
}
