import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { formatMembershipTier, formatCentavos } from '@/lib/format'
import CompleteRenewalPaymentButton from '@/components/membership/CompleteRenewalPaymentButton'

export default async function MembershipRenewalPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const membershipPayment = await prisma.membershipPayment.findUnique({
    where: { id },
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
        </div>
      </section>

      <div className="flex flex-1 flex-col items-center gap-8 bg-brand-light px-6 py-16">
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
            <div className="rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
              <dl className="flex flex-col">
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-brand-dark/70">Tier</dt>
                  <dd className="text-right font-medium text-brand-dark">
                    {formatMembershipTier(membershipPayment.tier)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                  <dt className="text-brand-dark/70">Activation Fee</dt>
                  <dd className="text-right font-medium text-brand-dark">
                    {formatCentavos(
                      MEMBERSHIP_TIER_PLANS[membershipPayment.tier].activationFeeCentavos,
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                  <dt className="text-brand-dark/70">F&amp;B Credit</dt>
                  <dd className="text-right font-medium text-brand-dark">
                    {formatCentavos(
                      MEMBERSHIP_TIER_PLANS[membershipPayment.tier].creditCentavos,
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                  <dt className="text-brand-dark/70">Total Due</dt>
                  <dd className="text-right font-medium text-brand-dark">
                    {formatCentavos(
                      MEMBERSHIP_TIER_PLANS[membershipPayment.tier].totalCentavos,
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <CompleteRenewalPaymentButton membershipPaymentId={membershipPayment.id} />
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
