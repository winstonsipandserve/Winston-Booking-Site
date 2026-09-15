import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { CreditTransactionReason } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSignedUrl } from '@/lib/supabase-storage'
import MembershipReviewActions from '@/components/admin/MembershipReviewActions'
import IdentityVerificationGallery from '@/components/admin/IdentityVerificationGallery'
import SendRenewalLinkButton from '@/components/admin/SendRenewalLinkButton'
import ResendActivationButton from '@/components/admin/ResendActivationButton'
import ResendPaymentLinkButton from '@/components/admin/ResendPaymentLinkButton'
import AddCreditButton from '@/components/admin/AddCreditButton'
import AdminPagination from '@/components/admin/AdminPagination'
import { formatBookingDateTime, formatCentavos, formatManilaDate, formatMembershipTier } from '@/lib/format'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { getRenewalEligibility, RENEWAL_WINDOW_DAYS } from '@/lib/membership-current'
import { manilaCalendarDaysBetween } from '@/lib/manila-date'
import { bookingGrandTotalCentavos } from '@/lib/booking-pricing'
import { getMembershipDisplayStatus, MEMBERSHIP_DISPLAY_STATUS_LABELS } from '@/lib/membership-display-status'
import { MembershipStatusPill } from '@/components/admin/StatusPill'
import { getLatestMembershipByCustomerId } from '@/lib/membership-latest'

const CREDIT_TRANSACTION_REASON_LABELS: Record<CreditTransactionReason, string> = {
  activation: 'Activation',
  renewal: 'Renewal',
  booking_redemption: 'Booking Redemption',
  top_up: 'Top-Up',
}

const HISTORY_PAGE_SIZE = 10

function parsePage(value: string | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1
}

export default async function AdminMembershipApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ creditPage?: string; bookingPage?: string }>
}) {
  const { id } = await params
  const { creditPage: creditPageParam, bookingPage: bookingPageParam } = await searchParams

  const application = await prisma.membershipApplication.findUnique({
    where: { id },
    include: { customer: true, reviewedBy: true },
    relationLoadStrategy: 'query',
  })

  if (!application) {
    notFound()
  }

  const [latestMembership, renewal] = await Promise.all([
    getLatestMembershipByCustomerId(application.customerId),
    getRenewalEligibility(application.customerId),
  ])
  const displayStatus = getMembershipDisplayStatus({ status: application.status, latestMembership })
  // Renewal links follow the same window as self-service renewal: expired, or the single
  // live term ends within RENEWAL_WINDOW_DAYS and nothing is queued behind it.
  const canSendRenewalLink = displayStatus !== 'awaiting_payment' && latestMembership !== null && renewal.eligible
  const needsActivation = latestMembership !== null && !application.customer.passwordHash

  const requestedCreditPage = parsePage(creditPageParam)
  const requestedBookingPage = parsePage(bookingPageParam)

  const history = latestMembership
    ? await (async () => {
        const [creditTransactionCount, bookingCount] = await Promise.all([
          prisma.membershipCreditTransaction.count({ where: { membershipId: latestMembership.id } }),
          prisma.booking.count({ where: { customerId: application.customerId } }),
        ])

        const creditTotalPages = Math.max(1, Math.ceil(creditTransactionCount / HISTORY_PAGE_SIZE))
        const bookingTotalPages = Math.max(1, Math.ceil(bookingCount / HISTORY_PAGE_SIZE))
        const creditPage = Math.min(requestedCreditPage, creditTotalPages)
        const bookingPage = Math.min(requestedBookingPage, bookingTotalPages)

        const [creditTransactions, recentBookings] = await Promise.all([
          prisma.membershipCreditTransaction.findMany({
            where: { membershipId: latestMembership.id },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (creditPage - 1) * HISTORY_PAGE_SIZE,
            take: HISTORY_PAGE_SIZE,
          }),
          prisma.booking.findMany({
            where: { customerId: application.customerId },
            orderBy: [{ startTime: 'desc' }, { id: 'desc' }],
            skip: (bookingPage - 1) * HISTORY_PAGE_SIZE,
            take: HISTORY_PAGE_SIZE,
            include: {
              resource: { include: { resourceType: true } },
              addOns: { select: { amountCentavos: true } },
            },
            relationLoadStrategy: 'query',
          }),
        ])

        const newerTransactionAmount = creditTransactions[0]
          ? await prisma.membershipCreditTransaction.aggregate({
              where: {
                membershipId: latestMembership.id,
                OR: [
                  { createdAt: { gt: creditTransactions[0].createdAt } },
                  {
                    createdAt: creditTransactions[0].createdAt,
                    id: { gt: creditTransactions[0].id },
                  },
                ],
              },
              _sum: { amountCentavos: true },
            })
          : null

        return {
          creditTransactions,
          recentBookings,
          creditTransactionCount,
          bookingCount,
          creditPage,
          creditTotalPages,
          bookingPage,
          bookingTotalPages,
          newerTransactionAmount: newerTransactionAmount?._sum.amountCentavos ?? 0,
        }
      })()
    : {
        creditTransactions: [],
        recentBookings: [],
        creditTransactionCount: 0,
        bookingCount: 0,
        creditPage: 1,
        creditTotalPages: 1,
        bookingPage: 1,
        bookingTotalPages: 1,
        newerTransactionAmount: 0,
      }

  const {
    creditTransactions,
    recentBookings,
    creditTransactionCount,
    bookingCount,
    creditPage,
    creditTotalPages,
    bookingPage,
    bookingTotalPages,
  } = history

  const [govIdFrontUrl, govIdBackUrl, govIdSelfieUrl, totalBookingsCount, upcomingBookingsCount] = await Promise.all([
    getSignedUrl('membership-applications', application.govIdFrontUrl),
    getSignedUrl('membership-applications', application.govIdBackUrl),
    getSignedUrl('membership-applications', application.govIdSelfieUrl),
    prisma.booking.count({ where: { customerId: application.customerId, status: 'confirmed' } }),
    prisma.booking.count({
      where: { customerId: application.customerId, status: 'confirmed', startTime: { gt: new Date() } },
    }),
  ])

  const daysRemaining = latestMembership
    ? Math.max(0, manilaCalendarDaysBetween(new Date(), latestMembership.endDate))
    : 0

  const startingBalance = (latestMembership?.creditBalanceCentavos ?? 0) - history.newerTransactionAmount
  const transactionsWithBalance = creditTransactions.map((transaction, index) => {
    const newerTransactionTotal = creditTransactions
      .slice(0, index)
      .reduce((total, newerTransaction) => total + newerTransaction.amountCentavos, 0)
    return { ...transaction, balanceAfter: startingBalance - newerTransactionTotal }
  })

  const historyParams = new URLSearchParams()
  if (creditPage > 1) historyParams.set('creditPage', String(creditPage))
  if (bookingPage > 1) historyParams.set('bookingPage', String(bookingPage))

  function historyPageHref(key: 'creditPage' | 'bookingPage', targetPage: number) {
    const params = new URLSearchParams(historyParams)
    if (targetPage <= 1) {
      params.delete(key)
    } else {
      params.set(key, String(targetPage))
    }
    const query = params.toString()
    return `/admin/memberships/${id}${query ? `?${query}` : ''}`
  }

  return (
    <div className="flex flex-col">
      <AdminPageHeader
        backHref="/admin/memberships"
        backLabel="Back to memberships"
        title={application.customer.name}
        subtitle={
          latestMembership
            ? `${formatMembershipTier(latestMembership.tier)} member since ${formatManilaDate(latestMembership.startDate)}`
            : `${formatMembershipTier(application.requestedTier)} application · Submitted ${formatManilaDate(application.createdAt)}`
        }
        recordId={application.id}
        aside={<MembershipStatusPill status={displayStatus} />}
      />

      {!latestMembership && (
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Applicant</h2>
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Name</span>
              <span className="text-right font-medium text-gray-900 dark:text-gray-100">{application.customer.name}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="text-right font-medium text-gray-900 dark:text-gray-100">{application.customer.email}</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 text-sm last:border-0">
              <span className="text-gray-500 dark:text-gray-400">Phone</span>
              <span className="text-right font-medium text-gray-900 dark:text-gray-100">{application.customer.phone}</span>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Application</h2>
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Requested Tier</span>
              <span className="text-right font-medium text-gray-900 dark:text-gray-100">{formatMembershipTier(application.requestedTier)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Address</span>
              <span className="text-right font-medium text-gray-900 dark:text-gray-100">{application.address}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Contact Number</span>
              <span className="text-right font-medium text-gray-900 dark:text-gray-100">{application.contactNumber}</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 text-sm last:border-0">
              <span className="text-gray-500 dark:text-gray-400">Submitted</span>
              <span className="text-right font-medium text-gray-900 dark:text-gray-100">
                {formatBookingDateTime(application.createdAt)}
              </span>
            </div>
          </section>
        </div>
      )}

      {displayStatus === 'awaiting_payment' && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-300 bg-blue-50 p-4 dark:border-blue-700/60 dark:bg-blue-950/40">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            This applicant hasn&apos;t completed payment yet. If their link expired, send a new
            one.
          </p>
          <ResendPaymentLinkButton applicationId={application.id} email={application.customer.email} />
        </div>
      )}

      {latestMembership && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Tier</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatMembershipTier(latestMembership.tier)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Credits</p>
                {displayStatus === 'active' && (
                  <AddCreditButton membershipId={latestMembership.id} memberName={application.customer.name} />
                )}
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCentavos(latestMembership.creditBalanceCentavos)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Bookings</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {totalBookingsCount} Total &middot; {upcomingBookingsCount} Upcoming
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Expiry</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{daysRemaining} Days</p>
            </div>
          </div>

          {needsActivation && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/60 dark:bg-amber-950/40">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                This member has never set a password and can&apos;t sign in.
              </p>
              <ResendActivationButton applicationId={application.id} email={application.customer.email} />
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Member Information</h2>
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Name</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">{application.customer.name}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Email</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">{application.customer.email}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Phone</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">{application.customer.phone}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Address</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">{application.address}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-2 text-sm last:border-0">
                <span className="text-gray-500 dark:text-gray-400">Joined</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatBookingDateTime(application.createdAt)}
                </span>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Membership Details</h2>
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Tier</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatMembershipTier(latestMembership.tier)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">
                  {MEMBERSHIP_DISPLAY_STATUS_LABELS[displayStatus]}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Activated</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatManilaDate(latestMembership.startDate)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Expires</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatManilaDate(latestMembership.endDate)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 py-2 text-sm last:border-0">
                <span className="text-gray-500 dark:text-gray-400">Credit Balance</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatCentavos(latestMembership.creditBalanceCentavos)}
                </span>
              </div>
            </section>
          </div>
        </>
      )}

      {application.status === 'pending' && (
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Identity Verification</h2>
          <IdentityVerificationGallery
            images={[
              { label: 'Front', url: govIdFrontUrl },
              { label: 'Back', url: govIdBackUrl },
              { label: 'Selfie', url: govIdSelfieUrl },
            ]}
          />
        </section>
      )}

      {application.status !== 'pending' && (
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Review</h2>
          {!application.reviewedById ? (
            <p className="text-sm italic text-gray-500 dark:text-gray-400">Not yet reviewed</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Reviewed By</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">{application.reviewedBy?.name}</span>
              </div>
              <div
                className={`flex items-center justify-between gap-4 py-2 text-sm ${
                  application.status === 'rejected' && application.rejectionReason
                    ? 'border-b border-gray-100 dark:border-gray-800'
                    : 'last:border-0'
                }`}
              >
                <span className="text-gray-500 dark:text-gray-400">Reviewed At</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">
                  {application.reviewedAt
                    ? formatBookingDateTime(application.reviewedAt)
                    : '—'}
                </span>
              </div>
              {application.status === 'rejected' && application.rejectionReason && (
                <div className="flex items-center justify-between gap-4 py-2 text-sm last:border-0">
                  <span className="text-gray-500 dark:text-gray-400">Rejection Reason</span>
                  <span className="text-right font-medium text-gray-900 dark:text-gray-100">{application.rejectionReason}</span>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {application.status !== 'pending' && (
        <details className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100">
            Verification Documents
          </summary>
          <div className="mt-4">
            <IdentityVerificationGallery
              images={[
                { label: 'Front', url: govIdFrontUrl },
                { label: 'Back', url: govIdBackUrl },
                { label: 'Selfie', url: govIdSelfieUrl },
              ]}
            />
          </div>
        </details>
      )}

      {latestMembership && (
        <section className="mb-6 flex flex-col rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Credit Transaction History</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full min-w-[480px] table-fixed border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr className="h-[42px]">
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Date
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Reason
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Amount
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Balance
                    </th>
                  </tr>
              </thead>
              <tbody>
                  {transactionsWithBalance.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="h-[46px] border-b border-gray-100 last:border-b-0 even:bg-gray-50/70 dark:border-gray-800 dark:even:bg-gray-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {formatBookingDateTime(transaction.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {CREDIT_TRANSACTION_REASON_LABELS[transaction.reason]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {transaction.amountCentavos >= 0 ? '+' : '-'}
                        {formatCentavos(Math.abs(transaction.amountCentavos))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {formatCentavos(transaction.balanceAfter)}
                      </td>
                    </tr>
                  ))}
                  {creditTransactions.length === 0 && (
                    <tr className="h-[46px] border-b border-gray-100 dark:border-gray-800">
                      <td colSpan={4} className="px-4 py-2.5 text-sm italic text-gray-500 dark:text-gray-400">
                        No credit activity yet
                      </td>
                    </tr>
                  )}
                  {Array.from({ length: HISTORY_PAGE_SIZE - Math.max(transactionsWithBalance.length, 1) }).map((_, index) => (
                    <tr
                      key={`credit-placeholder-${index}`}
                      aria-hidden="true"
                      className="h-[46px] border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                    >
                      <td colSpan={4} className="px-4 py-2.5">&nbsp;</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <AdminPagination
              page={creditPage}
              pageSize={HISTORY_PAGE_SIZE}
              totalCount={creditTransactionCount}
              noun="transaction"
              previousHref={historyPageHref('creditPage', Math.max(1, creditPage - 1))}
              nextHref={historyPageHref('creditPage', Math.min(creditTotalPages, creditPage + 1))}
            />
          </div>
        </section>
      )}

      {latestMembership && (
        <section className="mb-6 flex flex-col rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Booking History</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full min-w-[840px] border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr className="h-[42px]">
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Reference
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Date & Time
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Resource
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Guests
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Total
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Action
                    </th>
                  </tr>
              </thead>
              <tbody>
                  {recentBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="h-[46px] border-b border-gray-100 last:border-b-0 even:bg-gray-50/70 dark:border-gray-800 dark:even:bg-gray-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400">{booking.id}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {formatBookingDateTime(booking.startTime)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {booking.resource.resourceType.name} — {booking.resource.label}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-900 dark:text-gray-100">{booking.guestCount}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-900 dark:text-gray-100">{booking.status}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {formatCentavos(bookingGrandTotalCentavos(booking))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {recentBookings.length === 0 && (
                    <tr className="h-[46px] border-b border-gray-100 dark:border-gray-800">
                      <td colSpan={7} className="px-4 py-2.5 text-sm italic text-gray-500 dark:text-gray-400">
                        No bookings yet
                      </td>
                    </tr>
                  )}
                  {Array.from({ length: HISTORY_PAGE_SIZE - Math.max(recentBookings.length, 1) }).map((_, index) => (
                    <tr
                      key={`booking-placeholder-${index}`}
                      aria-hidden="true"
                      className="h-[46px] border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                    >
                      <td colSpan={7} className="px-4 py-2.5">&nbsp;</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <AdminPagination
              page={bookingPage}
              pageSize={HISTORY_PAGE_SIZE}
              totalCount={bookingCount}
              noun="booking"
              previousHref={historyPageHref('bookingPage', Math.max(1, bookingPage - 1))}
              nextHref={historyPageHref('bookingPage', Math.min(bookingTotalPages, bookingPage + 1))}
            />
          </div>
        </section>
      )}

      {application.status === 'pending' && (
        <MembershipReviewActions applicationId={application.id} applicantName={application.customer.name} />
      )}

      {canSendRenewalLink && (
        <section className="mt-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Renewal</h2>
          {displayStatus === 'active' && (
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              This membership ends within the next {RENEWAL_WINDOW_DAYS} days. A renewal paid now starts the day after the current term ends.
            </p>
          )}
          <SendRenewalLinkButton applicationId={application.id} />
        </section>
      )}
      {!renewal.eligible && renewal.reason === 'already_scheduled' && (
        <section className="mt-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Renewal</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A renewal is already paid and scheduled to start when the current term ends.
          </p>
        </section>
      )}
    </div>
  )
}
