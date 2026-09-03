import { RateTier } from '@prisma/client'
import BookingSummary from '../BookingSummary'

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
  rateTier: RateTier
  hasSession: boolean
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
  rateTier,
  hasSession,
}: ReviewStepProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <BookingSummary
        resourceTypeName={resourceTypeName}
        resourceLabel={resourceLabel}
        startTimeLocal={startTimeLocal}
        durationMinutes={durationMinutes}
        isCourt={isCourt}
        guestCount={guestCount}
        ballBoy={ballBoy}
        ballBoyPriceCentavos={ballBoyPriceCentavos}
        coaching={coaching}
        coachingPaxCount={coachingPaxCount}
        estimateCentavos={estimateCentavos}
        addOnsEstimateCentavos={addOnsEstimateCentavos}
        rateTier={rateTier}
        hasSession={hasSession}
        showIcons
      />

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 rounded-none border border-brand-dark/20 px-5 py-3 text-sm font-medium uppercase tracking-wide text-brand-dark/70 transition-colors hover:bg-brand-dark/5 hover:text-brand-dark disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirmBooking}
          disabled={submitting}
          className="flex-1 rounded-none bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light disabled:opacity-50"
        >
          {submitting ? 'Creating your booking…' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  )
}
