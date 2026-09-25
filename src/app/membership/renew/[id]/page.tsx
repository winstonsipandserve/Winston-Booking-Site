import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { prisma } from '@/lib/prisma'
import { formatMembershipPlanLabel, standardTierPriceCentavos } from '@/lib/membership-pricing'
import CompleteRenewalPaymentButton from '@/components/membership/CompleteRenewalPaymentButton'
import MembershipCheckoutSummary from '@/components/membership/MembershipCheckoutSummary'
import { lookupRenewalPaymentLinkToken } from '@/lib/membership-payment-link'

export default async function MembershipRenewalPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams

  const membershipPayment = await prisma.membershipPayment.findUnique({
    where: { id },
    include: { customer: true },
  })

  if (!membershipPayment) {
    notFound()
  }

  // The token only gates the still-outstanding-payment state — "already renewed" below is
  // already a terminal, non-actionable page.
  let linkError: string | null = null
  if (membershipPayment.status !== 'paid') {
    if (!token) {
      linkError = 'This payment link is missing its access code. Please use the link from your email.'
    } else {
      const result = await lookupRenewalPaymentLinkToken(membershipPayment.id, token)
      if (!result.ok) {
        linkError =
          result.status === 404
            ? 'This payment link is invalid. Please use the most recent email we sent you.'
            : 'This payment link has expired or is no longer valid. Please contact us and we’ll send you a new one.'
      }
    }
  }

  return (
    <>
      <Navbar />

      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
        <div className="w-full max-w-sm">
          <p className="text-center text-sm text-gray-500">Membership</p>
          <h1 className="mt-1 text-center text-2xl font-semibold text-gray-900">
            Complete Your Renewal
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Settle the amount below to keep your membership active.
          </p>

          <div className="mt-6">
            {membershipPayment.status === 'paid' ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-gray-900">You&apos;re already renewed!</p>
                <Link href="/login" className="text-gray-900 underline underline-offset-2 hover:text-gray-700">
                  Log in to your account
                </Link>
              </div>
            ) : linkError ? (
              <p className="text-center text-red-600">{linkError}</p>
            ) : (
              <div className="flex w-full flex-col gap-3">
                <MembershipCheckoutSummary
                  bordered={false}
                  totalHighlighted={false}
                  compact
                  tierLabel={formatMembershipPlanLabel(membershipPayment.tier, membershipPayment.isFounding)}
                  customerName={membershipPayment.customer.name}
                  totalCentavos={membershipPayment.amountCentavos}
                  founding={
                    // Only show the strikethrough when this price is actually discounted —
                    // a Founding Member's own renewal is flagged Founding but priced
                    // standard, and showing "was ₱6,500, now ₱6,500" would be confusing.
                    membershipPayment.amountCentavos < standardTierPriceCentavos(membershipPayment.tier)
                      ? { standardCentavos: standardTierPriceCentavos(membershipPayment.tier) }
                      : null
                  }
                />

                <p className="rounded-md border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
                  You&apos;ll be redirected to PayMongo to complete payment securely.
                </p>

                <CompleteRenewalPaymentButton
                  membershipPaymentId={membershipPayment.id}
                  token={token as string}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
