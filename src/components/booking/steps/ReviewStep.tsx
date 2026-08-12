import { formatCentavos } from '@/lib/format'

interface ReviewStepProps {
  resourceTypeName: string
  resourceLabel: string
  startTimeLocal: string
  durationMinutes: string
  isCourt: boolean
  guestCount: number
  name: string
  phone: string
  email: string
  ballBoy: boolean
  ballBoyPriceCentavos: number | null
  coaching: boolean
  coachingPaxCount: number | null
  estimateCentavos: number | null
  addOnsEstimateCentavos: number
  submitting: boolean
  submitError: string | null
  checkingOut: boolean
  checkoutError: string | null
  onBack: () => void
  onConfirm: () => void
  onRetryCheckout: () => void
  onStartOver: () => void
}

export default function ReviewStep({
  resourceTypeName,
  resourceLabel,
  startTimeLocal,
  durationMinutes,
  isCourt,
  guestCount,
  name,
  phone,
  email,
  ballBoy,
  ballBoyPriceCentavos,
  coaching,
  coachingPaxCount,
  estimateCentavos,
  addOnsEstimateCentavos,
  submitting,
  submitError,
  checkingOut,
  checkoutError,
  onBack,
  onConfirm,
  onRetryCheckout,
  onStartOver,
}: ReviewStepProps) {
  const startDisplay = startTimeLocal ? new Date(startTimeLocal).toLocaleString('en-PH') : ''

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Sport</dt>
          <dd>{resourceTypeName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Court / bay</dt>
          <dd>{resourceLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Date &amp; time</dt>
          <dd>{startDisplay}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Duration</dt>
          <dd>{durationMinutes} minutes</dd>
        </div>
        {isCourt && (
          <div className="flex justify-between gap-4">
            <dt className="font-medium">Guests</dt>
            <dd>{guestCount}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Name</dt>
          <dd>{name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Phone</dt>
          <dd>{phone}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Email</dt>
          <dd>{email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Ball Boy</dt>
          <dd>
            {ballBoy
              ? ballBoyPriceCentavos !== null
                ? formatCentavos(ballBoyPriceCentavos)
                : 'Selected'
              : 'Not selected'}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Coaching</dt>
          <dd>
            {coaching
              ? isCourt && coachingPaxCount !== null
                ? `${coachingPaxCount} Pax`
                : 'Selected'
              : 'Not selected'}
          </dd>
        </div>
      </dl>

      <div className="rounded border border-black/[.08] bg-black/[.03] px-3 py-2 text-sm dark:border-white/[.08] dark:bg-white/[.04]">
        {estimateCentavos !== null ? (
          <>
            <p className="font-medium">
              Estimated price: {formatCentavos(estimateCentavos + addOnsEstimateCentavos)}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Add-ons subtotal: {formatCentavos(addOnsEstimateCentavos)}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Estimated at non-member rate — your final price reflects any active membership.
            </p>
          </>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No estimate available for this combination — your final price will be confirmed on
            submit.
          </p>
        )}
      </div>

      {checkoutError ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-red-600">{checkoutError}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onStartOver}
              disabled={checkingOut}
              className="flex-1 rounded-full border border-black/[.145] px-5 py-3 text-base font-medium transition-colors hover:bg-black/[.03] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-white/[.04]"
            >
              Start Over
            </button>
            <button
              type="button"
              onClick={onRetryCheckout}
              disabled={checkingOut}
              className="flex-1 rounded-full bg-foreground px-5 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              {checkingOut ? 'Redirecting to payment…' : 'Try Again'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={submitting || checkingOut}
              className="flex-1 rounded-full border border-black/[.145] px-5 py-3 text-base font-medium transition-colors hover:bg-black/[.03] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-white/[.04]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting || checkingOut}
              className="flex-1 rounded-full bg-foreground px-5 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              {submitting
                ? 'Creating your booking…'
                : checkingOut
                  ? 'Redirecting to payment…'
                  : 'Confirm Booking'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
