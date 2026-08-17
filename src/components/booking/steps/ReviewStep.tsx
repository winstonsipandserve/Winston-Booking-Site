import { formatCentavos } from '@/lib/format'

interface ReviewStepProps {
  resourceTypeName: string
  resourceLabel: string
  startTimeLocal: string
  durationMinutes: string
  isCourt: boolean
  guestCount: number
  ballBoy: boolean
  ballBoyPriceCentavos: number | null
  coaching: boolean
  coachingPaxCount: number | null
  estimateCentavos: number | null
  addOnsEstimateCentavos: number
  submitting: boolean
  submitError: string | null
  onBack: () => void
  onConfirmBooking: () => void
}

export default function ReviewStep({
  resourceTypeName,
  resourceLabel,
  startTimeLocal,
  durationMinutes,
  isCourt,
  guestCount,
  ballBoy,
  ballBoyPriceCentavos,
  coaching,
  coachingPaxCount,
  estimateCentavos,
  addOnsEstimateCentavos,
  submitting,
  submitError,
  onBack,
  onConfirmBooking,
}: ReviewStepProps) {
  const startDisplay = startTimeLocal ? new Date(startTimeLocal).toLocaleString('en-PH') : ''

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
        <dl className="flex flex-col">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-brand-dark/70">Sport</dt>
            <dd className="text-right font-medium text-brand-dark">{resourceTypeName}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
            <dt className="text-brand-dark/70">Court / bay</dt>
            <dd className="text-right font-medium text-brand-dark">{resourceLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
            <dt className="text-brand-dark/70">Date &amp; time</dt>
            <dd className="text-right font-medium text-brand-dark">{startDisplay}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
            <dt className="text-brand-dark/70">Duration</dt>
            <dd className="text-right font-medium text-brand-dark">{durationMinutes} minutes</dd>
          </div>
          {isCourt && (
            <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
              <dt className="text-brand-dark/70">Guests</dt>
              <dd className="text-right font-medium text-brand-dark">{guestCount}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
            <dt className="text-brand-dark/70">Ball Boy</dt>
            <dd className="text-right font-medium text-brand-dark">
              {ballBoy
                ? ballBoyPriceCentavos !== null
                  ? formatCentavos(ballBoyPriceCentavos)
                  : 'Selected'
                : 'Not selected'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
            <dt className="text-brand-dark/70">Coaching</dt>
            <dd className="text-right font-medium text-brand-dark">
              {coaching
                ? isCourt && coachingPaxCount !== null
                  ? `${coachingPaxCount} Pax`
                  : 'Selected'
                : 'Not selected'}
            </dd>
          </div>
        </dl>

        <div className="mt-2 border-t border-brand-dark/10 pt-4">
          {estimateCentavos !== null ? (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-serif text-brand-dark">Estimated price</span>
                <span className="text-2xl font-medium text-accent-primary">
                  {formatCentavos(estimateCentavos + addOnsEstimateCentavos)}
                </span>
              </div>
              <p className="mt-1 text-sm text-brand-dark/60">
                Add-ons subtotal: {formatCentavos(addOnsEstimateCentavos)}
              </p>
              <p className="text-sm text-brand-dark/60">
                Estimated at non-member rate — your final price reflects any active membership.
              </p>
            </>
          ) : (
            <p className="text-sm text-brand-dark/60">
              No estimate available for this combination — your final price will be confirmed on
              submit.
            </p>
          )}
        </div>
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 rounded-full border border-brand-dark/20 px-5 py-3 text-sm font-medium uppercase tracking-wide text-brand-dark/70 transition-colors hover:bg-brand-dark/5 hover:text-brand-dark disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirmBooking}
          disabled={submitting}
          className="flex-1 rounded-full bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light disabled:opacity-50"
        >
          {submitting ? 'Creating your booking…' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  )
}
