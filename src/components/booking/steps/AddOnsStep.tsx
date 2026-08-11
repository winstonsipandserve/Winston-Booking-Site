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
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {isCourt && (
        <div className="flex flex-col gap-1">
          <label htmlFor="guestCount" className="text-sm font-medium">
            Number of guests
          </label>
          <input
            id="guestCount"
            type="number"
            min={0}
            value={guestCount}
            onChange={(e) => onGuestCountChange(Math.max(0, Number(e.target.value)))}
            className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
          />
        </div>
      )}

      <div className="flex flex-col gap-2 rounded border border-black/[.08] px-3 py-2 dark:border-white/[.08]">
        {isCourt && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ballBoy}
              onChange={(e) => onBallBoyChange(e.target.checked)}
            />
            Ball Boy
            {ballBoyPricing.priceCentavos !== null &&
              ` — ${formatCentavos(ballBoyPricing.priceCentavos)}`}
          </label>
        )}

        {coachingPricing.available && (
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={coaching}
                onChange={(e) => onCoachingChange(e.target.checked)}
              />
              Coaching
              {coachingPricing.mode === 'flat' &&
                coachingPricing.flatPriceCentavos !== null &&
                ` — ${formatCentavos(coachingPricing.flatPriceCentavos)}`}
            </label>

            {coaching && coachingPricing.mode === 'paxTiered' && (
              <div className="ml-6 flex flex-col gap-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="coachingPaxCount"
                    checked={coachingPaxCount === 1}
                    onChange={() => onCoachingPaxCountChange(1)}
                  />
                  1 Pax
                  {coachingPricing.pax1PriceCentavos !== null &&
                    ` — ${formatCentavos(coachingPricing.pax1PriceCentavos)}`}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="coachingPaxCount"
                    checked={coachingPaxCount === 2}
                    onChange={() => onCoachingPaxCountChange(2)}
                  />
                  2 Pax
                  {coachingPricing.pax2PriceCentavos !== null &&
                    ` — ${formatCentavos(coachingPricing.pax2PriceCentavos)}`}
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
