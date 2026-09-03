import { RateTier } from '@prisma/client'
import { formatCentavos } from '@/lib/format'
import BookingSummary from '../BookingSummary'

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
  guestCount: number
  ballBoy: boolean
  ballBoyPriceCentavos: number | null
  coaching: boolean
  coachingPaxCount: number | null
  estimateCentavos: number | null
  addOnsEstimateCentavos: number
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
  guestCount,
  ballBoy,
  ballBoyPriceCentavos,
  coaching,
  coachingPaxCount,
  estimateCentavos,
  addOnsEstimateCentavos,
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

  const buttonLabel = checkingOut
    ? 'Redirecting to payment…'
    : attachingCustomer
      ? 'Confirming your details…'
      : customerAttached && priceUpdate
        ? 'Continue to Payment'
        : 'Pay Now'

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="font-serif text-2xl text-brand-dark">Payment</h2>
        <p className="text-sm text-brand-dark/60">
          Booking Reference: <span className="font-medium text-brand-dark">{bookingId}</span>
        </p>
      </div>

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
      />

      {knownCustomer ? (
        <div className="rounded-card border border-brand-dark/10 bg-brand-light px-6 py-4 text-sm text-brand-dark shadow-xl shadow-brand-dark/10">
          Booking under <span className="font-medium">{knownCustomer.name}</span> (
          {knownCustomer.email})
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-card border border-brand-dark/10 bg-brand-light px-6 py-6 shadow-xl shadow-brand-dark/10">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-brand-dark">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              disabled={customerAttached}
              onChange={(e) => onNameChange(e.target.value)}
              className="rounded-input border border-brand-dark/20 bg-brand-light px-3 py-2 text-brand-dark placeholder:text-brand-dark/40 focus:border-accent-primary focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-sm font-medium text-brand-dark">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              disabled={customerAttached}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="rounded-input border border-brand-dark/20 bg-brand-light px-3 py-2 text-brand-dark placeholder:text-brand-dark/40 focus:border-accent-primary focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-brand-dark">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              disabled={customerAttached}
              onChange={(e) => onEmailChange(e.target.value)}
              className="rounded-input border border-brand-dark/20 bg-brand-light px-3 py-2 text-brand-dark placeholder:text-brand-dark/40 focus:border-accent-primary focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>
      )}

      <div className="rounded-card-inline border border-brand-dark/10 bg-brand-dark/[0.03] px-4 py-3 text-sm text-brand-dark/70">
        All bookings are final. We don&apos;t offer refunds or rescheduling once a booking is
        confirmed.
      </div>

      {priceUpdate && (
        <div className="rounded-card-inline border border-accent-primary/30 bg-accent-primary/5 px-4 py-3 text-sm font-medium text-brand-dark">
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
          className="flex-1 rounded-none border border-brand-dark/20 px-5 py-3 text-sm font-medium uppercase tracking-wide text-brand-dark/70 transition-colors hover:bg-brand-dark/5 hover:text-brand-dark disabled:opacity-50"
        >
          Start Over
        </button>
        <button
          type="button"
          onClick={onPayNow}
          disabled={disabled}
          className="flex-1 rounded-none bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
