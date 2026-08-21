import Image from 'next/image'
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

// Placeholder value only — real per-member QR scheme (check-in token vs. credit
// redemption, static vs. rotating, generation method) is not yet decided.
const MEMBER_QR_VALUE = 'WSS-MEMBER-0001'

export default function MembershipStatusCard() {
  const creditPct = Math.round(
    (SAMPLE_MEMBERSHIP.remainingCreditCentavos / SAMPLE_MEMBERSHIP.creditCentavos) * 100
  )

  return (
    <div className="flex flex-col rounded-2xl bg-brand-dark px-6 py-6 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/images/brand/winston-logo-emblem-transparent.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain brightness-0 invert"
          />
          <h2 className="font-serif text-xl text-neutral-100">Membership Status</h2>
        </div>
        <span className="rounded-full bg-accent-primary px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-light">
          {SAMPLE_MEMBERSHIP.tierName}
        </span>
      </div>

      <p className="mt-3 text-sm text-accent-light/80">
        {formatCentavos(SAMPLE_MEMBERSHIP.activationCentavos)} activation +{' '}
        {formatCentavos(SAMPLE_MEMBERSHIP.creditCentavos)} F&amp;B credit
      </p>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="flex flex-1 flex-col">
          <div className="border-t border-brand-light/15 pt-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-accent-light/70">Remaining credit</span>
              <span className="text-lg font-medium text-neutral-100">
                {formatCentavos(SAMPLE_MEMBERSHIP.remainingCreditCentavos)} of{' '}
                {formatCentavos(SAMPLE_MEMBERSHIP.creditCentavos)}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-brand-light/20">
              <div className="h-full rounded bg-accent-primary" style={{ width: `${creditPct}%` }} />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-brand-light/15 pt-3">
            <span className="text-accent-light/70">Expires</span>
            <span className="font-medium text-neutral-100">{SAMPLE_MEMBERSHIP.expiryDate}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-brand-light/15 pt-4">
            {PERKS.map((perk) => (
              <span key={perk} className="flex items-center gap-1.5 text-xs text-accent-light/90">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-accent-primary">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {perk}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 md:shrink-0">
          <div className="rounded-xl bg-brand-light p-3">
            {/* MEMBER_QR_VALUE is a placeholder — real encoding scheme not yet decided */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${MEMBER_QR_VALUE}`}
              alt="QR code for member check-in at the front desk"
              width={140}
              height={140}
              className="h-[140px] w-[140px]"
            />
          </div>
          <p className="max-w-[160px] text-center text-xs text-accent-light/70">
            Show this code at the front desk for check-in.
          </p>
        </div>
      </div>
    </div>
  )
}
