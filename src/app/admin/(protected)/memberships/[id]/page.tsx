import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSignedUrl } from '@/lib/supabase-storage'
import type { ApplicationStatus, MembershipTier } from '@prisma/client'

function formatTier(tier: MembershipTier) {
  switch (tier) {
    case 'three_month':
      return '3-Month'
    case 'six_month':
      return '6-Month'
    case 'twelve_month':
      return '12-Month'
  }
}

const STATUS_PILL_CLASSES: Record<ApplicationStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
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

  const [govIdFrontUrl, govIdBackUrl, govIdSelfieUrl] = await Promise.all([
    getSignedUrl('membership-applications', application.govIdFrontUrl),
    getSignedUrl('membership-applications', application.govIdBackUrl),
    getSignedUrl('membership-applications', application.govIdSelfieUrl),
  ])

  return (
    <div>
      <Link
        href="/admin/memberships"
        className="mb-4 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        <span className="mr-1">&larr;</span>
        Back to memberships
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Membership Application</h1>
          <p className="text-xs font-mono text-gray-400">{application.id}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_PILL_CLASSES[application.status]}`}
        >
          {application.status}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Applicant</h2>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm">
            <span className="text-gray-500">Name</span>
            <span className="text-right font-medium text-gray-900">{application.customer.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm">
            <span className="text-gray-500">Email</span>
            <span className="text-right font-medium text-gray-900">{application.customer.email}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-2 text-sm last:border-0">
            <span className="text-gray-500">Phone</span>
            <span className="text-right font-medium text-gray-900">{application.customer.phone}</span>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Application</h2>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm">
            <span className="text-gray-500">Requested Tier</span>
            <span className="text-right font-medium text-gray-900">{formatTier(application.requestedTier)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm">
            <span className="text-gray-500">Address</span>
            <span className="text-right font-medium text-gray-900">{application.address}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm">
            <span className="text-gray-500">Contact Number</span>
            <span className="text-right font-medium text-gray-900">{application.contactNumber}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-2 text-sm last:border-0">
            <span className="text-gray-500">Submitted</span>
            <span className="text-right font-medium text-gray-900">
              {application.createdAt.toLocaleString('en-PH')}
            </span>
          </div>
        </section>
      </div>

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Review</h2>
        {!application.reviewedById ? (
          <p className="text-sm italic text-gray-400">Not yet reviewed</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm">
              <span className="text-gray-500">Reviewed By</span>
              <span className="text-right font-medium text-gray-900">{application.reviewedBy?.name}</span>
            </div>
            <div
              className={`flex items-center justify-between gap-4 py-2 text-sm ${
                application.status === 'rejected' && application.rejectionReason
                  ? 'border-b border-gray-100'
                  : 'last:border-0'
              }`}
            >
              <span className="text-gray-500">Reviewed At</span>
              <span className="text-right font-medium text-gray-900">
                {application.reviewedAt ? application.reviewedAt.toLocaleString('en-PH') : '—'}
              </span>
            </div>
            {application.status === 'rejected' && application.rejectionReason && (
              <div className="flex items-center justify-between gap-4 py-2 text-sm last:border-0">
                <span className="text-gray-500">Rejection Reason</span>
                <span className="text-right font-medium text-gray-900">{application.rejectionReason}</span>
              </div>
            )}
          </>
        )}
      </section>

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Government ID</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Front</p>
            <a href={govIdFrontUrl} target="_blank" rel="noopener noreferrer">
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <img
                  src={govIdFrontUrl}
                  alt="Government ID — front"
                  className="h-full w-full cursor-zoom-in object-cover transition-opacity hover:opacity-90"
                />
              </div>
            </a>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Back</p>
            <a href={govIdBackUrl} target="_blank" rel="noopener noreferrer">
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <img
                  src={govIdBackUrl}
                  alt="Government ID — back"
                  className="h-full w-full cursor-zoom-in object-cover transition-opacity hover:opacity-90"
                />
              </div>
            </a>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Selfie</p>
            <a href={govIdSelfieUrl} target="_blank" rel="noopener noreferrer">
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
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

      <section>
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Review Actions</h2>
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            disabled
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Approve
          </button>
          <button
            type="button"
            disabled
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reject
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Approve/reject actions are not wired yet — coming in a future update.
        </p>
      </section>
    </div>
  )
}
