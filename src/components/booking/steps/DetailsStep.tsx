interface DetailsStepProps {
  isCourt: boolean
  guestCount: number
  onGuestCountChange: (value: number) => void
  name: string
  onNameChange: (value: string) => void
  phone: string
  onPhoneChange: (value: string) => void
  email: string
  onEmailChange: (value: string) => void
  ballBoy: boolean
  onBallBoyChange: (value: boolean) => void
  coaching: boolean
  onCoachingChange: (value: boolean) => void
}

export default function DetailsStep({
  isCourt,
  guestCount,
  onGuestCountChange,
  name,
  onNameChange,
  phone,
  onPhoneChange,
  email,
  onEmailChange,
  ballBoy,
  onBallBoyChange,
  coaching,
  onCoachingChange,
}: DetailsStepProps) {
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

      <div className="flex flex-col gap-2 rounded border border-black/[.08] px-3 py-2 dark:border-white/[.08]">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={ballBoy}
            onChange={(e) => onBallBoyChange(e.target.checked)}
          />
          Ball Boy
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={coaching}
            onChange={(e) => onCoachingChange(e.target.checked)}
          />
          Coaching
        </label>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Coming soon — not yet included in your booking.
        </p>
      </div>
    </div>
  )
}
