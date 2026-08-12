interface PaymentStepProps {
  name: string
  onNameChange: (value: string) => void
  phone: string
  onPhoneChange: (value: string) => void
  email: string
  onEmailChange: (value: string) => void
  bookingId: string | null
  submitting: boolean
  submitError: string | null
  checkingOut: boolean
  checkoutError: string | null
  onPayNow: () => void
  onBack: () => void
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
  submitting,
  submitError,
  checkingOut,
  checkoutError,
  onPayNow,
  onBack,
  onStartOver,
}: PaymentStepProps) {
  const isValid = name.trim().length > 0 && phone.trim().length > 0 && email.trim().length > 0
  const hasError = !!submitError || !!checkoutError

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
          onChange={(e) => onNameChange(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
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
          onChange={(e) => onPhoneChange(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
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
          onChange={(e) => onEmailChange(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
        />
      </div>

      {bookingId && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Booking Reference: {bookingId}</p>
      )}

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      {checkoutError && <p className="text-sm text-red-600">{checkoutError}</p>}

      <div className="flex gap-3">
        {!submitting && !checkingOut && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-full border border-black/[.145] px-5 py-3 text-base font-medium transition-colors hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.04]"
          >
            Back
          </button>
        )}
        {hasError && (
          <button
            type="button"
            onClick={onStartOver}
            disabled={submitting || checkingOut}
            className="flex-1 rounded-full border border-black/[.145] px-5 py-3 text-base font-medium transition-colors hover:bg-black/[.03] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-white/[.04]"
          >
            Start Over
          </button>
        )}
        <button
          type="button"
          onClick={onPayNow}
          disabled={!isValid || submitting || checkingOut}
          className="flex-1 rounded-full bg-foreground px-5 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {submitting
            ? 'Creating your booking…'
            : checkingOut
              ? 'Redirecting to payment…'
              : 'Pay Now'}
        </button>
      </div>
    </div>
  )
}
