import Link from 'next/link'

interface MembershipRenewalConfirmationProps {
  tierName: string
}

export default function MembershipRenewalConfirmation({
  tierName,
}: MembershipRenewalConfirmationProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="font-serif text-2xl text-brand-dark">Welcome back — your membership has been renewed!</h2>
      </div>

      <div className="rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
        <dl className="flex flex-col">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-brand-dark/70">Membership Tier</dt>
            <dd className="text-right font-medium text-brand-dark">{tierName}</dd>
          </div>
        </dl>
      </div>

      <Link
        href="/account"
        className="rounded-full bg-accent-primary px-9 py-3.5 text-center text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark"
      >
        Go to My Account
      </Link>
    </div>
  )
}
