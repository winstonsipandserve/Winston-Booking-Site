import Link from 'next/link'

interface MembershipRenewalConfirmationProps {
  tierName: string
  bordered?: boolean
}

export default function MembershipRenewalConfirmation({
  tierName,
  bordered = true,
}: MembershipRenewalConfirmationProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="font-serif text-2xl text-brand-dark">Welcome back — your membership has been renewed!</h2>
      </div>

      <div
        className={
          bordered
            ? 'rounded-card border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10'
            : 'rounded-card-inline border border-brand-dark/10 bg-brand-dark/[0.03] px-5 py-4'
        }
      >
        <dl className="flex flex-col">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-brand-dark/70">Membership Tier</dt>
            <dd className="text-right font-medium text-brand-dark">{tierName}</dd>
          </div>
        </dl>
      </div>

      <Link
        href="/account"
        className="w-full rounded-none bg-accent-primary px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.08em] text-brand-light transition-colors hover:bg-accent-dark"
      >
        Go to My Account
      </Link>
    </div>
  )
}
