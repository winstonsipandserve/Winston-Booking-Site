import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { formatMembershipTier, formatCentavos } from '@/lib/format'
import CompletePaymentButton from '@/components/membership/CompletePaymentButton'

export default async function MembershipPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const application = await prisma.membershipApplication.findUnique({
    where: { id },
    include: { customer: true, membership: true },
    relationLoadStrategy: 'query',
  })

  if (!application) {
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
            Complete Your Membership
          </h1>
        </div>
      </section>

      <div className="flex flex-1 flex-col items-center gap-8 bg-brand-light px-6 py-16">
        {application.membership ? (
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <p className="text-brand-dark">You&apos;re already a member!</p>
            <Link
              href="/login"
              className="text-accent-primary underline underline-offset-2 hover:text-accent-dark"
            >
              Log in to your account
            </Link>
          </div>
        ) : application.status === 'pending' ? (
          <p className="max-w-md text-center text-brand-dark/60">
            Your application is still under review — we&apos;ll email you once it&apos;s approved.
          </p>
        ) : application.status === 'rejected' ? (
          <p className="max-w-md text-center text-brand-dark/60">
            This application wasn&apos;t approved. Check your email for details.
          </p>
        ) : (
          <div className="flex w-full max-w-md flex-col gap-4">
            <div className="rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
              <dl className="flex flex-col">
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-brand-dark/70">Tier</dt>
                  <dd className="text-right font-medium text-brand-dark">
                    {formatMembershipTier(application.requestedTier)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                  <dt className="text-brand-dark/70">Activation Fee</dt>
                  <dd className="text-right font-medium text-brand-dark">
                    {formatCentavos(
                      MEMBERSHIP_TIER_PLANS[application.requestedTier].activationFeeCentavos,
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                  <dt className="text-brand-dark/70">F&amp;B Credit</dt>
                  <dd className="text-right font-medium text-brand-dark">
                    {formatCentavos(
                      MEMBERSHIP_TIER_PLANS[application.requestedTier].creditCentavos,
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                  <dt className="text-brand-dark/70">Total Due</dt>
                  <dd className="text-right font-medium text-brand-dark">
                    {formatCentavos(
                      MEMBERSHIP_TIER_PLANS[application.requestedTier].totalCentavos,
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <CompletePaymentButton applicationId={application.id} />
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
