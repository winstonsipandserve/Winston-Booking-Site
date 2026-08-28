import Link from 'next/link'
import type { ApplicationStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatMembershipTier } from '@/lib/format'
import {
  getMembershipDisplayStatus,
  MEMBERSHIP_DISPLAY_STATUS_LABELS,
  MEMBERSHIP_DISPLAY_STATUS_CLASSES,
} from '@/lib/membership-display-status'

const PAGE_SIZE = 25

function isApplicationStatus(value: string): value is ApplicationStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected'
}

function formatDateTime(date: Date) {
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const STATUS_FILTERS: { label: string; value: ApplicationStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default async function AdminMembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  console.time('memberships:pageTotal')
  const { status: statusParam, page: pageParam } = await searchParams

  const status = statusParam && isApplicationStatus(statusParam) ? statusParam : undefined
  const page = Math.max(1, Number(pageParam) || 1)

  const where: Prisma.MembershipApplicationWhereInput = {}
  if (status) {
    where.status = status
  }

  console.time('memberships:promiseAll')
  const [applications, totalCount] = await Promise.all([
    prisma.membershipApplication.findMany({
      where,
      include: { customer: true, reviewedBy: true, membership: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      relationLoadStrategy: 'join',
    }),
    prisma.membershipApplication.count({ where }),
  ])
  console.timeEnd('memberships:promiseAll')

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  function pageHref(targetPage: number) {
    const params = new URLSearchParams()
    if (statusParam) params.set('status', statusParam)
    params.set('page', String(targetPage))
    return `/admin/memberships?${params.toString()}`
  }

  function filterHref(value: ApplicationStatus | 'all') {
    const params = new URLSearchParams()
    if (value !== 'all') params.set('status', value)
    return `/admin/memberships?${params.toString()}`
  }

  console.timeEnd('memberships:pageTotal')

  return (
    <div className="flex h-full flex-col gap-4">
      <h1 className="text-2xl font-semibold text-gray-900">Memberships</h1>

      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map((filter) => {
          const isActive = (status ?? 'all') === filter.value
          return (
            <Link
              key={filter.value}
              href={filterHref(filter.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                isActive
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </Link>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Applicant
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Email
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Requested Tier
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Status
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Submitted
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Reviewed By
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr
                key={application.id}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              >
                <td className="px-4 py-2.5 text-gray-900">{application.customer.name}</td>
                <td className="px-4 py-2.5 text-gray-900">{application.customer.email}</td>
                <td className="px-4 py-2.5 text-gray-900">{formatMembershipTier(application.requestedTier)}</td>
                <td className="px-4 py-2.5">
                  {(() => {
                    const displayStatus = getMembershipDisplayStatus(application)
                    return (
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${MEMBERSHIP_DISPLAY_STATUS_CLASSES[displayStatus]}`}
                      >
                        {MEMBERSHIP_DISPLAY_STATUS_LABELS[displayStatus]}
                      </span>
                    )
                  })()}
                </td>
                <td className="px-4 py-2.5 text-gray-900">{formatDateTime(application.createdAt)}</td>
                <td className="px-4 py-2.5 text-gray-900">
                  {application.reviewedBy?.name ?? '—'}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/memberships/${application.id}`}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        {page > 1 && (
          <Link href={pageHref(page - 1)} className="font-medium text-gray-900 hover:underline">
            Prev
          </Link>
        )}
        <span>
          Page {page} of {totalPages}
        </span>
        {page < totalPages && (
          <Link href={pageHref(page + 1)} className="font-medium text-gray-900 hover:underline">
            Next
          </Link>
        )}
      </div>
    </div>
  )
}
