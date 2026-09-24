import { RateTier } from '@prisma/client'
import BookingSummary from '../BookingSummary'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

interface ReviewStepProps {
  resourceTypeName: string
  resourceLabel: string
  startTimeLocal: string
  durationMinutes: string
  isCourt: boolean
  guestCount: number
  coaching: boolean
  coachingPaxCount: number | null
  coachingPriceCentavos: number | null
  estimateCentavos: number | null
  discountEstimateCentavos: number
  discountLabel: string
  guestPassesApplied: number
  addOnsEstimateCentavos: number
  guestFeeCentavos: number
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
  coaching,
  coachingPaxCount,
  coachingPriceCentavos,
  estimateCentavos,
  discountEstimateCentavos,
  discountLabel,
  guestPassesApplied,
  addOnsEstimateCentavos,
  guestFeeCentavos,
  submitting,
  submitError,
  onBack,
  onConfirmBooking,
  rateTier,
  hasSession,
}: ReviewStepProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <LoadingOverlay isOpen={submitting} label="Creating your booking…" />
      <h2 className="text-xl font-semibold text-gray-900">Summary</h2>
      <BookingSummary
        resourceTypeName={resourceTypeName}
        resourceLabel={resourceLabel}
        startTimeLocal={startTimeLocal}
        durationMinutes={durationMinutes}
        isCourt={isCourt}
        guestCount={guestCount}
        coaching={coaching}
        coachingPaxCount={coachingPaxCount}
        coachingPriceCentavos={coachingPriceCentavos}
        estimateCentavos={estimateCentavos}
        discountEstimateCentavos={discountEstimateCentavos}
        discountLabel={discountLabel}
        guestPassesApplied={guestPassesApplied}
        addOnsEstimateCentavos={addOnsEstimateCentavos}
        guestFeeCentavos={guestFeeCentavos}
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
          className="flex-1 rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirmBooking}
          disabled={submitting}
          className="flex-1 rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          Confirm Booking
        </button>
      </div>
    </div>
  )
}
