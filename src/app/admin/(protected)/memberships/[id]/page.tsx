import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { CreditTransactionReason } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSignedUrl } from '@/lib/supabase-storage'
import MembershipReviewActions from '@/components/admin/MembershipReviewActions'
import SendRenewalLinkButton from '@/components/admin/SendRenewalLinkButton'
import { formatMembershipTier, formatCentavos } from '@/lib/format'
import { bookingGrandTotalCentavos } from '@/lib/booking-pricing'
import {
  getMembershipDisplayStatus,
  MEMBERSHIP_DISPLAY_STATUS_LABELS,
  MEMBERSHIP_DISPLAY_STATUS_CLASSES,
} from '@/lib/membership-display-status'
import { getLatestMembershipByCustomerId } from '@/lib/membership-latest'

const CREDIT_TRANSACTION_REASON_LABELS: Record<CreditTransactionReason, string> = {
  activation: 'Activation',
  renewal: 'Renewal',
  booking_redemption: 'Booking Redemption',
}

export default async function AdminMembershipApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const application = await prisma.membershipApplication.findUnique({
    where: { id },
    include: { customer: true, reviewedBy: true },
    relationLoadStrategy: 'query',
  })

  if (!application) {
    notFound()
  }

  const latestMembership = await getLatestMembershipByCustomerId(application.customerId)
  const displayStatus = getMembershipDisplayStatus({ status: application.status, latestMembership })

  const creditTransactions = latestMembership
    ? await prisma.membershipCreditTransaction.findMany({
        where: { membershipId: latestMembership.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    : []

  const recentBookings = latestMembership
    ? await prisma.booking.findMany({
        where: { customerId: application.customerId },
        orderBy: { startTime: 'desc' },
        take: 10,
        include: {
          resource: { include: { resourceType: true } },
          addOns: { select: { amountCentavos: true } },
        },
        relationLoadStrategy: 'query',
      })
    : []

  const [govIdFrontUrl, govIdBackUrl, govIdSelfieUrl] = await Promise.all([
    getSignedUrl('membership-applications', application.govIdFrontUrl),
    getSignedUrl('membership-applications', application.govIdBackUrl),
    getSignedUrl('membership-applications', application.govIdSelfieUrl),
  ])

  return (
    <div className="relative isolate flex flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 hidden -z-10 dark:block dark:rounded-2xl dark:bg-gray-900"
      />
      <Link
        href="/admin/memberships"
        className="mb-4 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <span className="mr-1">&larr;</span>
        Back to memberships
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Membership Application</h1>
          <p className="text-xs font-mono text-gray-400 dark:text-gray-500">{application.id}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${MEMBERSHIP_DISPLAY_STATUS_CLASSES[displayStatus]}`}
        >
          {MEMBERSHIP_DISPLAY_STATUS_LABELS[displayStatus]}
        </span>
      </div>

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
              {application.createdAt.toLocaleString('en-PH')}
            </span>
          </div>
        </section>
      </div>

      {latestMembership && (
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Membership</h2>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Tier</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">
              {formatMembershipTier(latestMembership.tier)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Credit Balance</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">
              {formatCentavos(latestMembership.creditBalanceCentavos)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Start / Activation Date</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">
              {latestMembership.startDate.toLocaleString('en-PH')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-2 text-sm last:border-0">
            <span className="text-gray-500 dark:text-gray-400">Expiry Date</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">
              {latestMembership.endDate.toLocaleString('en-PH')}
            </span>
          </div>
        </section>
      )}

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Review</h2>
        {!application.reviewedById ? (
          <p className="text-sm italic text-gray-400 dark:text-gray-500">Not yet reviewed</p>
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
                {application.reviewedAt ? application.reviewedAt.toLocaleString('en-PH') : '—'}
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

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Government ID</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Front</p>
            <a href={govIdFrontUrl} target="_blank" rel="noopener noreferrer">
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                <img
                  src={govIdFrontUrl}
                  alt="Government ID — front"
                  className="h-full w-full cursor-zoom-in object-cover transition-opacity hover:opacity-90"
                />
              </div>
            </a>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Back</p>
            <a href={govIdBackUrl} target="_blank" rel="noopener noreferrer">
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                <img
                  src={govIdBackUrl}
                  alt="Government ID — back"
                  className="h-full w-full cursor-zoom-in object-cover transition-opacity hover:opacity-90"
                />
              </div>
            </a>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Selfie</p>
            <a href={govIdSelfieUrl} target="_blank" rel="noopener noreferrer">
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                <img
                  src={govIdSelfieUrl}
                  alt="Government ID — selfie"
                  className="h-full w-full cursor-zoom-in object-cover transition-opacity hover:opacity-90"
                />
              </div>
            </a>
          </div>
        </div>
      </section>

      {latestMembership && (
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Credit Transaction History</h2>
          {creditTransactions.length === 0 ? (
            <p className="text-sm italic text-gray-400 dark:text-gray-500">No credit activity yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Date
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Reason
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {creditTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                    >
                      <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {transaction.createdAt.toLocaleString('en-PH')}
                      </td>
                      <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {CREDIT_TRANSACTION_REASON_LABELS[transaction.reason]}
                      </td>
                      <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {transaction.amountCentavos >= 0 ? '+' : '-'}
                        {formatCentavos(Math.abs(transaction.amountCentavos))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {latestMembership && (
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Booking History</h2>
          {recentBookings.length === 0 ? (
            <p className="text-sm italic text-gray-400 dark:text-gray-500">No bookings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Date & Time
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      Resource
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
                      className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                    >
                      <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {booking.startTime.toLocaleString('en-PH')}
                      </td>
                      <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {booking.resource.resourceType.name} — {booking.resource.label}
                      </td>
                      <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{booking.status}</td>
                      <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {formatCentavos(bookingGrandTotalCentavos(booking))}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {application.status === 'pending' && (
        <section>
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Review Actions</h2>
          <MembershipReviewActions applicationId={application.id} />
        </section>
      )}

      {displayStatus === 'expired' && (
        <section className="mt-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Renewal</h2>
          <SendRenewalLinkButton applicationId={application.id} />
        </section>
      )}
    </div>
  )
}
