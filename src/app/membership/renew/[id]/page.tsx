import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { formatMembershipTier } from '@/lib/format'
import CompleteRenewalPaymentButton from '@/components/membership/CompleteRenewalPaymentButton'
import MembershipCheckoutSummary from '@/components/membership/MembershipCheckoutSummary'

export default async function MembershipRenewalPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const membershipPayment = await prisma.membershipPayment.findUnique({
    where: { id },
    include: { customer: true },
  })

  if (!membershipPayment) {
    notFound()
  }

  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden bg-brand-dark pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
          <span className="text-xs uppercase tracking-[0.35em] text-accent-light/90 md:text-sm">
            Membership
          </span>

          <h1 className="mt-5 font-serif text-4xl text-brand-light md:text-6xl">
            Complete Your Renewal
          </h1>

          <p className="mt-6 max-w-xl text-brand-light/80">
            Settle the amount below to keep your priority bookings, facility access, and F&amp;B
            credit active without interruption.
          </p>
        </div>
      </section>

      <div className="flex flex-1 flex-col items-center gap-8 bg-background px-6 py-16">
        {membershipPayment.status === 'paid' ? (
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <p className="text-brand-dark">You&apos;re already renewed!</p>
            <Link
              href="/login"
              className="text-accent-primary underline underline-offset-2 hover:text-accent-dark"
            >
              Log in to your account
            </Link>
          </div>
        ) : (
          <div className="flex w-full max-w-md flex-col gap-4">
            <MembershipCheckoutSummary
              tierLabel={formatMembershipTier(membershipPayment.tier)}
              customerName={membershipPayment.customer.name}
              activationFeeCentavos={
                MEMBERSHIP_TIER_PLANS[membershipPayment.tier].activationFeeCentavos
              }
              creditCentavos={MEMBERSHIP_TIER_PLANS[membershipPayment.tier].creditCentavos}
              totalCentavos={MEMBERSHIP_TIER_PLANS[membershipPayment.tier].totalCentavos}
            />

            <p className="rounded-card-inline border border-brand-dark/10 bg-brand-dark/[0.03] px-4 py-3 text-sm text-brand-dark/70">
              You&apos;ll be redirected to PayMongo to complete payment securely.
            </p>

            <CompleteRenewalPaymentButton membershipPaymentId={membershipPayment.id} />
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
