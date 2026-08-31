'use client'

import { formatCentavos } from '@/lib/format'

interface BallBoyPricing {
  available: boolean
  priceCentavos: number | null
}

interface CoachingPricing {
  available: boolean
  mode: 'flat' | 'paxTiered' | null
  flatPriceCentavos: number | null
  pax1PriceCentavos: number | null
  pax2PriceCentavos: number | null
}

interface AddOnsStepProps {
  isCourt: boolean
  guestCount: number
  onGuestCountChange: (value: number) => void
  ballBoy: boolean
  onBallBoyChange: (value: boolean) => void
  ballBoyPricing: BallBoyPricing
  coaching: boolean
  onCoachingChange: (value: boolean) => void
  coachingPricing: CoachingPricing
  coachingPaxCount: number | null
  onCoachingPaxCountChange: (value: number) => void
  hideGuestCount: boolean
}

export default function AddOnsStep({
  isCourt,
  guestCount,
  onGuestCountChange,
  ballBoy,
  onBallBoyChange,
  ballBoyPricing,
  coaching,
  onCoachingChange,
  coachingPricing,
  coachingPaxCount,
  onCoachingPaxCountChange,
  hideGuestCount,
}: AddOnsStepProps) {
  const coachingPriceCentavos =
    coachingPricing.mode === 'flat'
      ? coachingPricing.flatPriceCentavos
      : coachingPricing.mode === 'paxTiered'
        ? coachingPaxCount === 1
          ? coachingPricing.pax1PriceCentavos
          : coachingPaxCount === 2
            ? coachingPricing.pax2PriceCentavos
            : null
        : null

  const coachingNeedsPax =
    coaching && coachingPricing.mode === 'paxTiered' && coachingPaxCount === null

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
      <h2 className="font-serif text-2xl text-brand-dark">Add-Ons</h2>

      {isCourt && !hideGuestCount && (
        <div className="flex flex-col gap-2">
          <label htmlFor="guestCount" className="text-sm font-medium text-brand-dark">
            Number of guests
          </label>
          <div
            id="guestCount"
            className="flex w-full items-center justify-between rounded border border-brand-dark/20 px-2 py-2"
          >
            <button
              type="button"
              aria-label="Decrease guest count"
              onClick={() => onGuestCountChange(Math.max(0, guestCount - 1))}
              disabled={guestCount <= 0}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-accent-primary text-lg font-medium text-brand-light transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              −
            </button>
            <span className="text-base font-medium text-brand-dark">{guestCount}</span>
            <button
              type="button"
              aria-label="Increase guest count"
              onClick={() => onGuestCountChange(guestCount + 1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-accent-primary text-lg font-medium text-brand-light transition-colors hover:bg-accent-dark"
            >
              +
            </button>
          </div>
        </div>
      )}

      {isCourt && hideGuestCount && (
        <p className="text-sm text-brand-dark/60">Guest fee doesn&apos;t apply to member bookings.</p>
      )}

      <div className="flex flex-col gap-3">
        {isCourt && (
          <button
            type="button"
            onClick={() => onBallBoyChange(!ballBoy)}
            aria-pressed={ballBoy}
            className={`flex w-full items-center gap-3 rounded border px-4 py-3 text-left transition-colors ${
              ballBoy ? 'border-accent-primary bg-accent-primary/5' : 'border-brand-dark/10'
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                ballBoy ? 'border-accent-primary bg-accent-primary' : 'border-brand-dark/30'
              }`}
            >
              {ballBoy && (
                <svg viewBox="0 0 12 12" className="h-3 w-3 text-brand-light" fill="none">
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
            <span className="flex-1 text-sm text-brand-dark">Ball Boy</span>
            {ballBoyPricing.priceCentavos !== null && (
              <span className="text-sm font-medium text-brand-dark">
                {formatCentavos(ballBoyPricing.priceCentavos)}
              </span>
            )}
          </button>
        )}

        {coachingPricing.available && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onCoachingChange(!coaching)}
              aria-pressed={coaching}
              className={`flex w-full items-center gap-3 rounded border px-4 py-3 text-left transition-colors ${
                coaching ? 'border-accent-primary bg-accent-primary/5' : 'border-brand-dark/10'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                  coaching ? 'border-accent-primary bg-accent-primary' : 'border-brand-dark/30'
                }`}
              >
                {coaching && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3 text-brand-light" fill="none">
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
              <span className="flex-1 text-sm text-brand-dark">Coaching</span>
              {coachingNeedsPax ? (
                <span className="text-sm font-medium text-brand-dark/50">Select pax</span>
              ) : (
                coachingPriceCentavos !== null && (
                  <span className="text-sm font-medium text-brand-dark">
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
                  className={`rounded border px-4 py-2 text-sm font-medium text-brand-dark transition-colors ${
                    coachingPaxCount === 1
                      ? 'border-accent-primary bg-accent-primary/5'
                      : 'border-brand-dark/20 bg-brand-light hover:bg-brand-dark/5'
                  }`}
                >
                  1 Pax
                </button>
                <button
                  type="button"
                  aria-pressed={coachingPaxCount === 2}
                  onClick={() => onCoachingPaxCountChange(2)}
                  className={`rounded border px-4 py-2 text-sm font-medium text-brand-dark transition-colors ${
                    coachingPaxCount === 2
                      ? 'border-accent-primary bg-accent-primary/5'
                      : 'border-brand-dark/20 bg-brand-light hover:bg-brand-dark/5'
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
