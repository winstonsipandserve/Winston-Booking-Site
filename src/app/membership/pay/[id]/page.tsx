import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { prisma } from '@/lib/prisma'
import { formatMembershipPlanLabel, standardTierPriceCentavos } from '@/lib/membership-pricing'
import { quoteMembershipPrice } from '@/lib/membership-founding'
import CompletePaymentButton from '@/components/membership/CompletePaymentButton'
import MembershipCheckoutSummary from '@/components/membership/MembershipCheckoutSummary'
import { lookupApplicationPaymentLinkToken } from '@/lib/membership-payment-link'

export default async function MembershipPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams

  const application = await prisma.membershipApplication.findUnique({
    where: { id },
    include: { customer: true, membership: true },
    relationLoadStrategy: 'query',
  })

  if (!application) {
    notFound()
  }

  // Show the price checkout will charge: the pending payment row's snapshot when one exists
  // (a resumed checkout), otherwise a live Founding-aware quote (src/lib/membership-founding.ts).
  const pendingPayment = await prisma.membershipPayment.findFirst({
    where: { applicationId: application.id, status: 'pending' },
    orderBy: { createdAt: 'desc' },
  })
  const price = pendingPayment
    ? { amountCentavos: pendingPayment.amountCentavos, isFounding: pendingPayment.isFounding }
    : await quoteMembershipPrice(prisma, application.customerId, application.requestedTier)

  // The token only gates the still-outstanding-payment state — every other branch below
  // (already a member, still pending, rejected) is already a terminal, non-actionable page.
  let linkError: string | null = null
  if (!application.membership && application.status === 'approved') {
    if (!token) {
      linkError = "This payment link is missing its access code. Please use the link from your email."
    } else {
      const result = await lookupApplicationPaymentLinkToken(application.id, token)
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
            Complete Your Membership
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            One last step — settle the amount below and you&apos;re in. We&apos;ll email your
            activation link as soon as payment clears.
          </p>

          <div className="mt-6">
            {application.membership ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-gray-900">You&apos;re already a member!</p>
                <Link href="/login" className="text-gray-900 underline underline-offset-2 hover:text-gray-700">
                  Log in to your account
                </Link>
              </div>
            ) : application.status === 'pending' ? (
              <p className="text-center text-gray-500">
                Your application is still under review — we&apos;ll email you once it&apos;s
                approved.
              </p>
            ) : application.status === 'rejected' ? (
              <p className="text-center text-gray-500">
                This application wasn&apos;t approved. Check your email for details.
              </p>
            ) : linkError ? (
              <p className="text-center text-red-600">{linkError}</p>
            ) : (
              <div className="flex w-full flex-col gap-3">
                <MembershipCheckoutSummary
                  bordered={false}
                  totalHighlighted={false}
                  compact
                  tierLabel={formatMembershipPlanLabel(application.requestedTier, price.isFounding)}
                  customerName={application.customer.name}
                  totalCentavos={price.amountCentavos}
                  founding={
                    // Only show the strikethrough when this price is actually discounted —
                    // a Founding Member's own renewal is flagged Founding but priced
                    // standard, and showing "was ₱6,500, now ₱6,500" would be confusing.
                    price.amountCentavos < standardTierPriceCentavos(application.requestedTier)
                      ? { standardCentavos: standardTierPriceCentavos(application.requestedTier) }
                      : null
                  }
                />

                <p className="rounded-md border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
                  You&apos;ll be redirected to PayMongo to complete payment securely.
                </p>

                <CompletePaymentButton applicationId={application.id} token={token as string} />
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
