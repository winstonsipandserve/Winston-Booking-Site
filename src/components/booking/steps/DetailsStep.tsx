interface DetailsStepProps {
  name: string
  onNameChange: (value: string) => void
  phone: string
  onPhoneChange: (value: string) => void
  email: string
  onEmailChange: (value: string) => void
}

export default function DetailsStep({
  name,
  onNameChange,
  phone,
  onPhoneChange,
  email,
  onEmailChange,
}: DetailsStepProps) {
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
    </div>
  )
}
