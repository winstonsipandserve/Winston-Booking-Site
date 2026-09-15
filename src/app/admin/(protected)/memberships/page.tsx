import { Suspense } from 'react'
import Link from 'next/link'
import { formatManilaDate, formatMembershipTier } from '@/lib/format'
import { getMembershipDisplayStatus } from '@/lib/membership-display-status'
import { MembershipStatusPill } from '@/components/admin/StatusPill'
import { isMembershipDisplayStatusFilter, getMembershipApplicationsForFilter } from '@/lib/memberships-query'
import MembershipsFilterModal from '@/components/admin/MembershipsFilterModal'
import MembershipsExportButton from '@/components/admin/MembershipsExportButton'
import MembershipsSearchBar from '@/components/admin/MembershipsSearchBar'
import AdminPagination from '@/components/admin/AdminPagination'

const PAGE_SIZE = 25

export default async function AdminMembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; search?: string }>
}) {
  const { status: statusParam, page: pageParam, search } = await searchParams

  const filter = statusParam && isMembershipDisplayStatusFilter(statusParam) ? statusParam : 'all'
  const page = Math.max(1, Number(pageParam) || 1)
  const trimmedSearch = search?.trim()

  const { applications, totalCount, latestMembershipsByCustomer } = await getMembershipApplicationsForFilter(
    filter,
    { pagination: { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }, search: trimmedSearch },
  )

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  function pageHref(targetPage: number) {
    const params = new URLSearchParams()
    if (statusParam) params.set('status', statusParam)
    if (trimmedSearch) params.set('search', trimmedSearch)
    params.set('page', String(targetPage))
    return `/admin/memberships?${params.toString()}`
  }


  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MembershipsFilterModal status={filter} />
          <MembershipsExportButton status={filter} search={trimmedSearch ?? ''} totalCount={totalCount} />
        </div>

        <Suspense fallback={null}>
          <MembershipsSearchBar />
        </Suspense>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
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
                className="border-b border-gray-100 last:border-b-0 even:bg-gray-50/70 hover:bg-gray-100 dark:border-gray-800 dark:even:bg-gray-800/50 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{application.customer.name}</td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{application.customer.email}</td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{formatMembershipTier(application.requestedTier)}</td>
                <td className="px-4 py-2.5">
                  <MembershipStatusPill
                    status={getMembershipDisplayStatus({
                      status: application.status,
                      latestMembership: latestMembershipsByCustomer.get(application.customerId) ?? null,
                    })}
                  />
                </td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{formatManilaDate(application.createdAt)}</td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                  {application.reviewedBy?.name ?? '—'}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/memberships/${application.id}`}
                    className="inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
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

      <AdminPagination
        page={page}
        totalPages={totalPages}
        previousHref={pageHref(Math.max(1, page - 1))}
        nextHref={pageHref(Math.min(totalPages, page + 1))}
      />
    </div>
  )
}
