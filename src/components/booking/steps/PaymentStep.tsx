import { formatCentavos } from '@/lib/format'

interface PriceUpdate {
  originalCentavos: number
  finalCentavos: number
}

interface PaymentStepProps {
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
}

export default function PaymentStep({
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
}: PaymentStepProps) {
  const isValid = name.trim().length > 0 && phone.trim().length > 0 && email.trim().length > 0
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
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          disabled={customerAttached}
          onChange={(e) => onNameChange(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 disabled:opacity-50 dark:border-white/[.145]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          required
          value={phone}
          disabled={customerAttached}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 disabled:opacity-50 dark:border-white/[.145]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          disabled={customerAttached}
          onChange={(e) => onEmailChange(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 disabled:opacity-50 dark:border-white/[.145]"
        />
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">Booking Reference: {bookingId}</p>

      {priceUpdate && (
        <p className="rounded border border-black/[.08] bg-black/[.03] px-3 py-2 text-sm font-medium dark:border-white/[.08] dark:bg-white/[.04]">
          Your final price is {formatCentavos(priceUpdate.finalCentavos)} (was{' '}
          {formatCentavos(priceUpdate.originalCentavos)} for non-members) — member rate applied.
        </p>
      )}

      {attachError && <p className="text-sm text-red-600">{attachError}</p>}
      {checkoutError && <p className="text-sm text-red-600">{checkoutError}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onStartOver}
          disabled={attachingCustomer || checkingOut}
          className="flex-1 rounded-full border border-black/[.145] px-5 py-3 text-base font-medium transition-colors hover:bg-black/[.03] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-white/[.04]"
        >
          Start Over
        </button>
        <button
          type="button"
          onClick={onPayNow}
          disabled={disabled}
          className="flex-1 rounded-full bg-foreground px-5 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
