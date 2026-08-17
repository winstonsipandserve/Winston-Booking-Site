'use client'

import { useEffect } from 'react'
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
}: AddOnsStepProps) {
  // Guest count is "additional guests beyond the booker" (booker is exempt from the
  // guest fee — see PROJECT_CONTEXT.md § Guest Fee Rule), so headcount = 1 + guestCount,
  // capped at the 2-pax tier since no 3+ rate exists.
  const derivedPaxCount = guestCount > 0 ? 2 : 1

  useEffect(() => {
    if (!coaching || coachingPricing.mode !== 'paxTiered') return
    if (coachingPaxCount !== derivedPaxCount) {
      onCoachingPaxCountChange(derivedPaxCount)
    }
  }, [coaching, coachingPricing.mode, derivedPaxCount, coachingPaxCount, onCoachingPaxCountChange])

  const coachingPriceCentavos =
    coachingPricing.mode === 'flat'
      ? coachingPricing.flatPriceCentavos
      : coachingPricing.mode === 'paxTiered'
        ? derivedPaxCount === 1
          ? coachingPricing.pax1PriceCentavos
          : coachingPricing.pax2PriceCentavos
        : null

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
      <h2 className="font-serif text-2xl text-brand-dark">Add-Ons</h2>

      {isCourt && (
        <div className="flex flex-col gap-2">
          <label htmlFor="guestCount" className="text-sm font-medium text-brand-dark">
            Number of guests
          </label>
          <div
            id="guestCount"
            className="flex w-full items-center justify-between rounded-full border border-brand-dark/20 px-2 py-2"
          >
            <button
              type="button"
              aria-label="Decrease guest count"
              onClick={() => onGuestCountChange(Math.max(0, guestCount - 1))}
              disabled={guestCount <= 0}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary text-lg font-medium text-brand-light transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              −
            </button>
            <span className="text-base font-medium text-brand-dark">{guestCount}</span>
            <button
              type="button"
              aria-label="Increase guest count"
              onClick={() => onGuestCountChange(guestCount + 1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary text-lg font-medium text-brand-light transition-colors hover:bg-accent-dark"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {isCourt && (
          <button
            type="button"
            onClick={() => onBallBoyChange(!ballBoy)}
            aria-pressed={ballBoy}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
              ballBoy ? 'border-accent-primary bg-accent-primary/5' : 'border-brand-dark/10'
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
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
          <button
            type="button"
            onClick={() => onCoachingChange(!coaching)}
            aria-pressed={coaching}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
              coaching ? 'border-accent-primary bg-accent-primary/5' : 'border-brand-dark/10'
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
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
            {coachingPriceCentavos !== null && (
              <span className="text-sm font-medium text-brand-dark">
                {formatCentavos(coachingPriceCentavos)}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
