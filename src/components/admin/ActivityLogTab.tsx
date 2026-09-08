'use client'

import { useEffect, useState } from 'react'
import { formatBookingDateTime } from '@/lib/format'

type AdminActivityAction =
  | 'membership_application_approved'
  | 'membership_application_rejected'
  | 'membership_renewal_link_sent'
  | 'booking_rescheduled'

const ADMIN_ACTIVITY_ACTION_LABELS: Record<AdminActivityAction, string> = {
  membership_application_approved: 'Membership Approved',
  membership_application_rejected: 'Membership Rejected',
  membership_renewal_link_sent: 'Renewal Link Sent',
  booking_rescheduled: 'Booking Rescheduled',
}

interface ActivityLogItem {
  id: string
  adminName: string
  action: AdminActivityAction
  entityType: string
  entityId: string
  description: string
  createdAt: string
}

interface ActivityLogResponse {
  items: ActivityLogItem[]
  page: number
  pageSize: number
  totalCount: number
}

export default function ActivityLogTab() {
  const [data, setData] = useState<ActivityLogResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  async function loadActivityLog(targetPage: number) {
    setLoadError(null)
    try {
      const res = await fetch(`/api/admin/activity-log?page=${targetPage}`)
      if (!res.ok) {
        setLoadError('Failed to load activity log.')
        return
      }
      const json = (await res.json()) as ActivityLogResponse
      setData(json)
    } catch {
      setLoadError('Failed to load activity log.')
    }
  }

  useEffect(() => {
    // Refetching from the server on page change (not deriving from existing render
    // state) is the legitimate use case this lint rule otherwise guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadActivityLog(page)
  }, [page])

  if (loadError) {
    return <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
  }

  if (!data) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
  }

  if (data.totalCount === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No activity logged yet.</p>
  }

  const totalPages = Math.ceil(data.totalCount / data.pageSize)

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">Timestamp</th>
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">Admin</th>
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">Action</th>
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">Description</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{formatBookingDateTime(new Date(item.createdAt))}</td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{item.adminName}</td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{ADMIN_ACTIVITY_ACTION_LABELS[item.action]}</td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Page {data.page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => p - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={page * data.pageSize >= data.totalCount}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  )
}
