import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { formatMembershipTier } from '@/lib/format'
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

      <main className="flex min-h-screen items-center justify-center bg-background px-6 pt-24 pb-8 md:pt-28">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-card border border-brand-dark/10 bg-brand-light shadow-card md:grid-cols-2">
          <div className="relative min-h-[220px] overflow-hidden bg-brand-dark md:min-h-[560px]">
            <Image
              src="/images/placeholder.jpg"
              alt=""
              fill
              priority
              className="object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-brand-dark/70" />
            <div className="hero-text-shadow relative z-10 flex h-full flex-col justify-end p-8 sm:p-10 lg:p-12">
              <span className="text-xs uppercase tracking-[0.35em] text-accent-light/80">
                Winston Sip &amp; Serve
              </span>
              <h2 className="mt-4 max-w-md font-serif text-3xl leading-tight text-brand-light lg:text-4xl">
                Stay in the Game.
              </h2>
              <p className="mt-4 max-w-sm text-sm text-on-dark-muted">
                Renew today to keep your priority bookings, facility access, and F&amp;B credit
                active without interruption.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center border-t border-brand-dark/10 px-6 py-8 md:border-t-0 md:border-l md:px-12 md:py-10 lg:px-16">
            <div className="w-full max-w-sm">
              <span className="text-xs uppercase tracking-[0.35em] text-accent-primary">
                Membership
              </span>
              <h1 className="mt-2 font-serif text-3xl text-on-light md:text-4xl">
                Complete Your Renewal
              </h1>
              <p className="mt-1.5 text-sm text-on-light-muted">
                Settle the amount below to keep your membership active.
              </p>

              <div className="mt-5">
                {membershipPayment.status === 'paid' ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-brand-dark">You&apos;re already renewed!</p>
                    <Link
                      href="/login"
                      className="text-accent-primary underline underline-offset-2 hover:text-accent-dark"
                    >
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
                      tierLabel={formatMembershipTier(membershipPayment.tier)}
                      customerName={membershipPayment.customer.name}
                      activationFeeCentavos={
                        MEMBERSHIP_TIER_PLANS[membershipPayment.tier].activationFeeCentavos
                      }
                      creditCentavos={MEMBERSHIP_TIER_PLANS[membershipPayment.tier].creditCentavos}
                      totalCentavos={MEMBERSHIP_TIER_PLANS[membershipPayment.tier].totalCentavos}
                    />

                    <p className="rounded-card-inline border border-brand-dark/10 bg-brand-dark/[0.03] px-4 py-2.5 text-sm text-brand-dark/70">
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
          </div>
        </div>
      </main>
    </>
  )
}
