import { RateTier } from '@prisma/client'
import { formatCentavos } from '@/lib/format'
import BookingSummary from '../BookingSummary'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

interface PriceUpdate {
  originalCentavos: number
  finalCentavos: number
}

interface KnownCustomer {
  name: string
  email: string
}

interface PaymentStepProps {
  resourceTypeName: string
  resourceLabel: string
  startTimeLocal: string
  durationMinutes: string
  isCourt: boolean
  /** Coaching is offered on this resource type (never on spaces). */
  coachingAvailable: boolean
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
  name: string
  onNameChange: (value: string) => void
  phone: string
  onPhoneChange: (value: string) => void
  email: string
  onEmailChange: (value: string) => void
  bookingId: string
  attachingCustomer: boolean
  attachError: string | null
  customerAttached: boolean
  priceUpdate: PriceUpdate | null
  checkingOut: boolean
  checkoutError: string | null
  onPayNow: () => void
  onStartOver: () => void
  knownCustomer: KnownCustomer | null
  rateTier: RateTier
  hasSession: boolean
}

export default function PaymentStep({
  resourceTypeName,
  resourceLabel,
  startTimeLocal,
  durationMinutes,
  isCourt,
  coachingAvailable,
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
  name,
  onNameChange,
  phone,
  onPhoneChange,
  email,
  onEmailChange,
  bookingId,
  attachingCustomer,
  attachError,
  customerAttached,
  priceUpdate,
  checkingOut,
  checkoutError,
  onPayNow,
  onStartOver,
  knownCustomer,
  rateTier,
  hasSession,
}: PaymentStepProps) {
  const isValid = knownCustomer
    ? true
    : name.trim().length > 0 && phone.trim().length > 0 && email.trim().length > 0
  const disabled = checkingOut || attachingCustomer || (!customerAttached && !isValid)

  const buttonLabel = customerAttached && priceUpdate ? 'Continue to Payment' : 'Pay Now'
  const loadingLabel = checkingOut ? 'Redirecting to payment…' : 'Confirming your details…'

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <LoadingOverlay isOpen={checkingOut || attachingCustomer} label={loadingLabel} />
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Payment</h2>
      </div>

      <BookingSummary
        resourceTypeName={resourceTypeName}
        resourceLabel={resourceLabel}
        startTimeLocal={startTimeLocal}
        durationMinutes={durationMinutes}
        isCourt={isCourt}
        coachingAvailable={coachingAvailable}
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
        bookingReference={bookingId}
      />

      {knownCustomer ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-4 text-sm text-gray-900 shadow-sm">
          Booking under <span className="font-medium">{knownCustomer.name}</span> (
          {knownCustomer.email})
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-900">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              disabled={customerAttached}
              onChange={(e) => onNameChange(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-sm font-medium text-gray-900">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              disabled={customerAttached}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              disabled={customerAttached}
              onChange={(e) => onEmailChange(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        All bookings are final. We don&apos;t offer refunds or rescheduling once a booking is
        confirmed.
      </div>

      {priceUpdate && (
        <div className="rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900">
          Your final price is {formatCentavos(priceUpdate.finalCentavos)} (was{' '}
          {formatCentavos(priceUpdate.originalCentavos)}) — pricing was updated since you started
          this booking.
        </div>
      )}

      {attachError && <p className="text-sm text-red-600">{attachError}</p>}
      {checkoutError && <p className="text-sm text-red-600">{checkoutError}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onStartOver}
          disabled={attachingCustomer || checkingOut}
          className="flex-1 rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
        >
          Start Over
        </button>
        <button
          type="button"
          onClick={onPayNow}
          disabled={disabled}
          className="flex-1 rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
