import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatMembershipTier } from '@/lib/format'
import {
  getMembershipDisplayStatus,
  MEMBERSHIP_DISPLAY_STATUS_LABELS,
  MEMBERSHIP_DISPLAY_STATUS_CLASSES,
  type MembershipDisplayStatus,
} from '@/lib/membership-display-status'
import MembershipsFilterModal from '@/components/admin/MembershipsFilterModal'

const PAGE_SIZE = 25

const VALID_STATUS_FILTER_VALUES = new Set([
  'all',
  'pending',
  'awaiting_payment',
  'active',
  'expired',
  'rejected',
])

function isMembershipDisplayStatusFilter(value: string): value is MembershipDisplayStatus | 'all' {
  return VALID_STATUS_FILTER_VALUES.has(value)
}

function formatDateTime(date: Date) {
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type ApplicationWithRelations = Prisma.MembershipApplicationGetPayload<{
  include: {
    customer: { include: { memberships: true } }
    reviewedBy: true
  }
}>

export default async function AdminMembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  console.time('memberships:pageTotal')
  const { status: statusParam, page: pageParam } = await searchParams

  const filter = statusParam && isMembershipDisplayStatusFilter(statusParam) ? statusParam : 'all'
  const page = Math.max(1, Number(pageParam) || 1)

  let applications: ApplicationWithRelations[]
  let totalCount: number
  let latestMembershipsByCustomer: Map<string, { endDate: Date }>

  console.time('memberships:promiseAll')
  if (filter === 'all' || filter === 'pending' || filter === 'rejected') {
    const where: Prisma.MembershipApplicationWhereInput = {}
    if (filter !== 'all') {
      where.status = filter
    }

    const [dbApplications, dbTotalCount] = await Promise.all([
      prisma.membershipApplication.findMany({
        where,
        include: {
          customer: {
            include: {
              memberships: {
                orderBy: { startDate: 'desc' },
                take: 1,
              },
            },
          },
          reviewedBy: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        relationLoadStrategy: 'join',
      }),
      prisma.membershipApplication.count({ where }),
    ])
    applications = dbApplications
    totalCount = dbTotalCount

    latestMembershipsByCustomer = new Map(
      dbApplications
        .filter((application) => application.customer.memberships.length > 0)
        .map((application) => [
          application.customerId,
          { endDate: application.customer.memberships[0].endDate },
        ]),
    )
  } else {
    const approvedApplications = await prisma.membershipApplication.findMany({
      where: { status: 'approved' },
      include: {
        customer: {
          include: {
            memberships: {
              orderBy: { startDate: 'desc' },
              take: 1,
            },
          },
        },
        reviewedBy: true,
      },
      orderBy: { createdAt: 'desc' },
      relationLoadStrategy: 'join',
    })

    latestMembershipsByCustomer = new Map(
      approvedApplications
        .filter((application) => application.customer.memberships.length > 0)
        .map((application) => [
          application.customerId,
          { endDate: application.customer.memberships[0].endDate },
        ]),
    )

    const filteredApplications = approvedApplications.filter((application) => {
      const displayStatus = getMembershipDisplayStatus({
        status: application.status,
        latestMembership: latestMembershipsByCustomer.get(application.customerId) ?? null,
      })
      return displayStatus === filter
    })

    totalCount = filteredApplications.length
    applications = filteredApplications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  }
  console.timeEnd('memberships:promiseAll')

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  function pageHref(targetPage: number) {
    const params = new URLSearchParams()
    if (statusParam) params.set('status', statusParam)
    params.set('page', String(targetPage))
    return `/admin/memberships?${params.toString()}`
  }

  console.timeEnd('memberships:pageTotal')

  return (
    <div className="relative isolate flex h-full flex-col gap-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 hidden -z-10 dark:block dark:rounded-2xl dark:bg-gray-900"
      />
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Memberships</h1>

      <div className="flex items-center gap-2">
        <MembershipsFilterModal status={filter} />
        <button
          type="button"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Export
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                Applicant
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                Email
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                Requested Tier
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                Status
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                Submitted
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                Reviewed By
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr
                key={application.id}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{application.customer.name}</td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{application.customer.email}</td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{formatMembershipTier(application.requestedTier)}</td>
                <td className="px-4 py-2.5">
                  {(() => {
                    const displayStatus = getMembershipDisplayStatus({
                      status: application.status,
                      latestMembership: latestMembershipsByCustomer.get(application.customerId) ?? null,
                    })
                    return (
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${MEMBERSHIP_DISPLAY_STATUS_CLASSES[displayStatus]}`}
                      >
                        {MEMBERSHIP_DISPLAY_STATUS_LABELS[displayStatus]}
                      </span>
                    )
                  })()}
                </td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{formatDateTime(application.createdAt)}</td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                  {application.reviewedBy?.name ?? '—'}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/memberships/${application.id}`}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
        {page > 1 && (
          <Link href={pageHref(page - 1)} className="font-medium text-gray-900 hover:underline dark:text-gray-100">
            Prev
          </Link>
        )}
        <span>
          Page {page} of {totalPages}
        </span>
        {page < totalPages && (
          <Link href={pageHref(page + 1)} className="font-medium text-gray-900 hover:underline dark:text-gray-100">
            Next
          </Link>
        )}
      </div>
    </div>
  )
}
