import Link from 'next/link'
import type { RecentBooking, RecentApplication } from '@/lib/dashboard-data'

function BookingStatusPill({ status }: { status: 'confirmed' | 'pending' | 'cancelled' }) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">
        Confirmed
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        Pending
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400 line-through">
      Cancelled
    </span>
  )
}

interface DashboardActivityProps {
  recentBookings: RecentBooking[]
  recentApplications: RecentApplication[]
}

export default function DashboardActivity({ recentBookings, recentApplications }: DashboardActivityProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent Bookings</h2>
        <ul className="flex flex-col gap-3">
          {recentBookings.map((booking) => (
            <li key={booking.reference} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-gray-500">{booking.reference}</p>
                <p className="text-sm text-gray-900">
                  {booking.sport} &middot; {booking.date}, {booking.time}
                </p>
              </div>
              <BookingStatusPill status={booking.status} />
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Pending Membership Applications</h2>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {recentApplications.length}
          </span>
        </div>
        <ul className="flex flex-col gap-3">
          {recentApplications.map((application) => (
            <li key={application.name} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{application.name}</p>
                <p className="text-xs text-gray-500">
                  {application.tier} &middot; Submitted {application.submitted}
                </p>
              </div>
              <Link href="/admin/memberships" className="shrink-0 text-xs text-gray-500 hover:text-gray-900">
                Review &rarr;
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
