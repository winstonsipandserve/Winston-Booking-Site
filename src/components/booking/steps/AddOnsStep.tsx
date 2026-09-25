'use client'

import { formatCentavos } from '@/lib/format'

interface CoachingPricing {
  available: boolean
  mode: 'flat' | 'paxTiered' | null
  flatPriceCentavos: number | null
  pax1PriceCentavos: number | null
  pax2PriceCentavos: number | null
}

interface AddOnsStepProps {
  guestCount: number
  maxGuests: number
  onGuestCountChange: (value: number) => void
  /** Complimentary guest passes left in the covering term; 0 for non-members. */
  guestPassesRemaining: number
  guestPassesApplied: number
  useGuestPasses: boolean
  onUseGuestPassesChange: (value: boolean) => void
  /** The birthday-month court hour can be redeemed on the selected slot. */
  birthdayPerkEligible: boolean
  birthdayPerkKind: 'half' | 'free' | null
  useBirthdayPerk: boolean
  onUseBirthdayPerkChange: (value: boolean) => void
  coaching: boolean
  onCoachingChange: (value: boolean) => void
  coachingPricing: CoachingPricing
  coachingPaxCount: number | null
  onCoachingPaxCountChange: (value: number) => void
  coachingPriceCentavos: number | null
  guestFeeCentavos: number
}

export default function AddOnsStep({
  guestCount,
  maxGuests,
  onGuestCountChange,
  guestPassesRemaining,
  guestPassesApplied,
  useGuestPasses,
  onUseGuestPassesChange,
  birthdayPerkEligible,
  birthdayPerkKind,
  useBirthdayPerk,
  onUseBirthdayPerkChange,
  coaching,
  onCoachingChange,
  coachingPricing,
  coachingPaxCount,
  onCoachingPaxCountChange,
  coachingPriceCentavos,
  guestFeeCentavos,
}: AddOnsStepProps) {
  const coachingNeedsPax =
    coaching && coachingPricing.mode === 'paxTiered' && coachingPaxCount === null

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Add-Ons</h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="guestCount" className="text-sm font-medium text-gray-900">
          Number of non-member guests
        </label>
        <div
          id="guestCount"
          className="flex w-full items-center justify-between rounded-md border border-gray-200 px-2 py-2"
        >
          <button
            type="button"
            aria-label="Decrease non-member guest count"
            onClick={() => onGuestCountChange(Math.max(0, guestCount - 1))}
            disabled={guestCount <= 0}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-900 text-lg font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <span className="text-base font-medium text-gray-900">{guestCount}</span>
          <button
            type="button"
            aria-label="Increase non-member guest count"
            onClick={() => onGuestCountChange(Math.min(maxGuests, guestCount + 1))}
            disabled={guestCount >= maxGuests}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-900 text-lg font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
        <p className="text-sm text-gray-500">
          {formatCentavos(guestFeeCentavos)} fee applies per additional non-member guest · up to{' '}
          {maxGuests} non-member guests. A guest who is themself a Winston member enters free and
          doesn&apos;t need to be added here.
        </p>
        {guestPassesRemaining > 0 && guestCount > 0 && (
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900">
            <input
              type="checkbox"
              checked={useGuestPasses}
              onChange={(e) => onUseGuestPassesChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-gray-900"
            />
            <span>
              Use my complimentary guest passes
              <span className="block text-xs text-gray-500">
                {guestPassesRemaining} left this term
                {useGuestPasses && guestPassesApplied > 0
                  ? ` · waives the fee for ${guestPassesApplied} non-member guest${guestPassesApplied === 1 ? '' : 's'}`
                  : ''}
              </span>
            </span>
          </label>
        )}
      </div>

      {birthdayPerkEligible && (
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900">
          <input
            type="checkbox"
            checked={useBirthdayPerk}
            onChange={(e) => onUseBirthdayPerkChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-gray-900"
          />
          <span>
            Use my birthday court hour
            <span className="block text-xs text-gray-500">
              {birthdayPerkKind === 'free'
                ? 'This one-hour session is on us — happy birthday month!'
                : '50% off this one-hour session — happy birthday month!'}{' '}
              Once per membership year.
            </span>
          </span>
        </label>
      )}

      <div className="flex flex-col gap-3">
        {coachingPricing.available && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onCoachingChange(!coaching)}
              aria-pressed={coaching}
              className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
                coaching ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                  coaching ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                }`}
              >
                {coaching && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none">
                    <path
                      d="M2 6l2.5 2.5L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="flex-1 text-sm text-gray-900">Coaching</span>
              {coachingNeedsPax ? (
                <span className="text-sm font-medium text-gray-400">Select pax</span>
              ) : (
                coachingPriceCentavos !== null && (
                  <span className="text-sm font-medium text-gray-900">
                    {formatCentavos(coachingPriceCentavos)}
                  </span>
                )
              )}
            </button>

            {coaching && coachingPricing.mode === 'paxTiered' && (
              <div role="group" aria-label="Coaching pax" className="flex flex-wrap gap-2 pl-1">
                <button
                  type="button"
                  aria-pressed={coachingPaxCount === 1}
                  onClick={() => onCoachingPaxCountChange(1)}
                  className={`rounded-md border px-4 py-2 text-sm font-medium text-gray-900 transition-colors ${
                    coachingPaxCount === 1
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  1 Pax
                </button>
                <button
                  type="button"
                  aria-pressed={coachingPaxCount === 2}
                  onClick={() => onCoachingPaxCountChange(2)}
                  className={`rounded-md border px-4 py-2 text-sm font-medium text-gray-900 transition-colors ${
                    coachingPaxCount === 2
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  2 Pax
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
