import Link from 'next/link'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { prisma } from '@/lib/prisma'
import {
  MEMBERSHIP_TIER_ORDER,
  MEMBERSHIP_TIER_PLANS,
  computeMembershipEndDate,
  formatMembershipPlanLabel,
} from '@/lib/membership-pricing'
import { quoteMembershipPrice } from '@/lib/membership-founding'
import { formatCentavos, formatMembershipTier, formatMembershipExpiryDate } from '@/lib/format'
import { getRenewalEligibility } from '@/lib/membership-current'
import RenewMembershipButton from '@/components/membership/RenewMembershipButton'
import { getActiveMemberSession } from '@/lib/member-session'

export default async function RenewMembershipPage() {
  const memberSession = await getActiveMemberSession()
  if (!memberSession) {
    redirect('/login')
  }
  const { customer } = memberSession

  const renewal = await getRenewalEligibility(customer.id)

  if (!renewal.eligible) {
    redirect('/account')
  }

  if (!renewal.current) {
    const anyMembership = await prisma.membership.findFirst({
      where: { customerId: customer.id },
    })
    if (!anyMembership) {
      redirect('/membership/apply')
    }
  }

  // Renewing before the current term ends queues the new term behind it, so the page has
  // to show that — nobody should think they're paying to restart today. The queued start
  // mirrors the webhook (current endDate + 1ms) so the projected coverage dates match
  // what the member will actually receive.
  const current = renewal.current
  const queuedStart = current ? new Date(current.endDate.getTime() + 1) : null

  // Founding-aware prices per tier (a Founding Member keeps ₱5,000 on Premier).
  const quotes = new Map(
    await Promise.all(
      MEMBERSHIP_TIER_ORDER.map(
        async (tier) => [tier, await quoteMembershipPrice(prisma, customer.id, tier)] as const,
      ),
    ),
  )

  return (
    <>
      <Navbar />

      <main className="flex min-h-screen flex-col justify-center bg-background px-6 pt-24 pb-8 md:pt-24">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl">
              <span className="text-xs uppercase tracking-[0.35em] text-accent-primary">
                Membership
              </span>
              <h1 className="mt-2 font-serif text-3xl text-on-light md:text-4xl lg:text-5xl">
                Renew Your Membership
              </h1>
              <p className="mt-2 text-on-light-muted">
                Pick a plan and carry on — advance booking priority, member discounts, and a
                fresh set of guest passes. No reapplying, no gap.
              </p>
            </div>

            <Link
              href="/account"
              className="order-first inline-flex shrink-0 items-center gap-2 text-sm font-medium text-on-light-muted transition-colors hover:text-accent-primary md:order-none md:pt-1"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M10 3 5 8l5 5" />
              </svg>
              Back to account
            </Link>
          </div>

          {current && queuedStart ? (
            <dl className="mt-6 grid divide-y divide-brand-dark/10 rounded-card border border-brand-dark/10 bg-brand-light shadow-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="px-6 py-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-on-light-muted">
                  Current tier
                </dt>
                <dd className="mt-1 font-serif text-xl text-on-light">
                  {formatMembershipTier(current.tier)}
                </dd>
              </div>
              <div className="px-6 py-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-on-light-muted">
                  Current term ends
                </dt>
                <dd className="mt-1 font-serif text-xl text-on-light">
                  {formatMembershipExpiryDate(current.endDate)}
                </dd>
              </div>
              <div className="px-6 py-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-on-light-muted">
                  New term starts
                </dt>
                <dd className="mt-1 font-serif text-xl text-accent-primary">
                  {formatMembershipExpiryDate(queuedStart)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-6 rounded-card border border-brand-dark/10 bg-brand-light px-6 py-4 text-sm text-on-light-muted shadow-card">
              Your last term has ended. The tier you pick starts the moment your payment clears.
            </p>
          )}

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {MEMBERSHIP_TIER_ORDER.map((tier) => {
              const plan = MEMBERSHIP_TIER_PLANS[tier]
              const quote = quotes.get(tier)!
              const isCurrentTier = current?.tier === tier
              const projectedEnd = queuedStart ? computeMembershipEndDate(queuedStart, tier) : null

              return (
                <article
                  key={tier}
                  aria-label={`${formatMembershipTier(tier)} membership`}
                  className={`relative flex flex-col rounded-card border bg-brand-light p-6 shadow-card ${
                    isCurrentTier ? 'border-accent-primary/60' : 'border-brand-dark/10'
                  }`}
                >
                  {isCurrentTier && (
                    <span className="absolute -top-3 left-6 rounded-full bg-accent-primary px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-on-accent">
                      Your current tier
                    </span>
                  )}

                  <p className="text-xs uppercase tracking-[0.2em] text-on-light-muted">
                    {formatMembershipPlanLabel(tier, quote.isFounding)}
                  </p>
                  <p className="mt-2 font-serif text-4xl tabular-nums text-on-light">
                    {formatCentavos(quote.amountCentavos)}
                  </p>
                  <p className="mt-1.5 min-h-5 text-sm text-on-light-muted">
                    {projectedEnd
                      ? `Covers you through ${formatMembershipExpiryDate(projectedEnd)}`
                      : `${plan.months} months from your payment date`}
                  </p>

                  <dl className="mt-5 flex flex-col divide-y divide-brand-dark/10 border-y border-brand-dark/10">
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-sm text-on-light-muted">Term</dt>
                      <dd className="text-sm font-medium tabular-nums text-on-light">{plan.months} months</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-sm text-on-light-muted">Booking discount</dt>
                      <dd className="text-sm font-medium tabular-nums text-on-light">{plan.bookingDiscountPercent}%</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-sm text-on-light-muted">Guest passes</dt>
                      <dd className="text-sm font-medium tabular-nums text-on-light">{plan.guestPasses} / year</dd>
                    </div>
                  </dl>

                  <div className="mt-auto pt-5">
                    <RenewMembershipButton tier={tier} />
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-6 flex flex-col items-center gap-1.5 text-center text-sm text-on-light-muted">
            <p className="inline-flex items-center gap-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect x="3" y="7" width="10" height="7" rx="1.5" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
              </svg>
              You&apos;ll be redirected to PayMongo to complete payment securely.
            </p>
            {current && (
              <p>
                Each term has its own booking credit — spend what&apos;s left of your current
                balance before {formatMembershipExpiryDate(current.endDate)}.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
