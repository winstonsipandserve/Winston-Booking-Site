import Link from 'next/link'

interface MembershipPaymentConfirmationProps {
  tierName: string
  bordered?: boolean
}

export default function MembershipPaymentConfirmation({
  tierName,
  bordered = true,
}: MembershipPaymentConfirmationProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Welcome to Winston Sip &amp; Serve!</h2>
      </div>

      <div
        className={
          bordered
            ? 'rounded-lg border border-gray-200 bg-white px-6 py-6 shadow-sm'
            : 'rounded-md border border-gray-200 bg-gray-50 px-5 py-4'
        }
      >
        <dl className="flex flex-col">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-gray-500">Membership Tier</dt>
            <dd className="text-right font-medium text-gray-900">{tierName}</dd>
          </div>
        </dl>
      </div>

      <p className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        Check your email for an activation link to set your password and access your account.
      </p>

      <Link
        href="/"
        className="w-full rounded-md bg-gray-900 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
      >
        Back to Home
      </Link>
    </div>
  )
}
