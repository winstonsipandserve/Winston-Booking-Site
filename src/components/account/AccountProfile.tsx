export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function AccountProfile({
  name,
  email,
  phone,
}: {
  name: string
  email: string
  phone: string
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-sm font-semibold text-accent-primary">
          {getInitials(name)}
        </span>
        <h2 className="font-serif text-xl text-brand-dark">Profile</h2>
      </div>
      <dl className="mt-4 flex flex-col">
        <div className="flex flex-col gap-1 py-3">
          <dt className="text-brand-dark/70">Name</dt>
          <dd className="font-medium text-brand-dark">{name}</dd>
        </div>
        <div className="flex flex-col gap-1 border-t border-brand-dark/10 py-3">
          <dt className="text-brand-dark/70">Email</dt>
          <dd className="font-medium text-brand-dark">{email}</dd>
        </div>
        <div className="flex flex-col gap-1 border-t border-brand-dark/10 py-3">
          <dt className="text-brand-dark/70">Phone</dt>
          <dd className="font-medium text-brand-dark">{phone}</dd>
        </div>
      </dl>
    </div>
  )
}
