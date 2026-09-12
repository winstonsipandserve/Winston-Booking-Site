import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { formatMembershipTier } from '@/lib/format'
import RenewMembershipButton from '@/components/membership/RenewMembershipButton'
import MembershipCheckoutSummary from '@/components/membership/MembershipCheckoutSummary'
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

          <p className="mt-6 max-w-xl text-brand-light/80">
            Pick a tier below to pick up right where you left off — priority bookings, full
            facility access, and an F&amp;B credit to spend at the café and bar.
          </p>
        </div>
      </section>

      <div className="flex flex-1 flex-col items-center gap-8 bg-background px-6 py-16">
        <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
          {TIERS.map((tier) => {
            const plan = MEMBERSHIP_TIER_PLANS[tier]
            return (
              <div key={tier} className="flex w-full flex-col gap-4">
                <MembershipCheckoutSummary
                  tierLabel={formatMembershipTier(tier)}
                  activationFeeCentavos={plan.activationFeeCentavos}
                  creditCentavos={plan.creditCentavos}
                  totalCentavos={plan.totalCentavos}
                />

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
