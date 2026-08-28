import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { formatMembershipTier, formatCentavos } from '@/lib/format'
import RenewMembershipButton from '@/components/membership/RenewMembershipButton'
import { auth } from '../../../../auth'
import type { MembershipTier } from '@prisma/client'

const TIERS = Object.keys(MEMBERSHIP_TIER_PLANS) as MembershipTier[]

export default async function RenewMembershipPage() {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== 'member') {
    redirect('/login')
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.id },
  })

  if (!customer) {
    redirect('/login')
  }

  const activeMembership = await prisma.membership.findFirst({
    where: { customerId: customer.id, status: 'active', endDate: { gte: new Date() } },
  })

  if (activeMembership) {
    redirect('/account')
  }

  const anyMembership = await prisma.membership.findFirst({
    where: { customerId: customer.id },
  })

  if (!anyMembership) {
    redirect('/membership/apply')
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
            Renew Your Membership
          </h1>
        </div>
      </section>

      <div className="flex flex-1 flex-col items-center gap-8 bg-brand-light px-6 py-16">
        <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
          {TIERS.map((tier) => {
            const plan = MEMBERSHIP_TIER_PLANS[tier]
            return (
              <div
                key={tier}
                className="flex w-full flex-col gap-4 rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10"
              >
                <dl className="flex flex-col">
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-brand-dark/70">Tier</dt>
                    <dd className="text-right font-medium text-brand-dark">
                      {formatMembershipTier(tier)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                    <dt className="text-brand-dark/70">Activation Fee</dt>
                    <dd className="text-right font-medium text-brand-dark">
                      {formatCentavos(plan.activationFeeCentavos)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                    <dt className="text-brand-dark/70">F&amp;B Credit</dt>
                    <dd className="text-right font-medium text-brand-dark">
                      {formatCentavos(plan.creditCentavos)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                    <dt className="text-brand-dark/70">Total Due</dt>
                    <dd className="text-right font-medium text-brand-dark">
                      {formatCentavos(plan.totalCentavos)}
                    </dd>
                  </div>
                </dl>

                <RenewMembershipButton tier={tier} />
              </div>
            )
          })}
        </div>
      </div>
      <Footer />
    </>
  )
}
