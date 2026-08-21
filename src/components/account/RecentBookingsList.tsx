'use client'

import { useState } from 'react'
import { TennisIcon, PickleballIcon, GolfIcon, CalendarIcon } from '@/components/ui/Icons'

// SAMPLE CONTENT — hardcoded placeholder booking history for this frontend-only pass.
// Replace once member auth (Auth.js session tied to Customer/Booking) is wired.
// Status values are real Booking enum values (confirmed/cancelled/pending_payment) only.
const SAMPLE_BOOKINGS: {
  id: string
  resourceTypeName: string
  resourceLabel: string
  dateLabel: string
  status: 'confirmed' | 'cancelled' | 'pending_payment'
}[] = [
  {
    id: 'sample-1',
    resourceTypeName: 'Pickleball Court',
    resourceLabel: 'Court 2',
    dateLabel: 'Sep 12, 2026, 6:00 PM',
    status: 'confirmed',
  },
  {
    id: 'sample-2',
    resourceTypeName: 'Tennis Court',
    resourceLabel: 'Court 1',
    dateLabel: 'Sep 5, 2026, 4:00 PM',
    status: 'confirmed',
  },
  {
    id: 'sample-3',
    resourceTypeName: 'Golf Simulator',
    resourceLabel: 'Bay 1',
    dateLabel: 'Aug 29, 2026, 7:00 AM',
    status: 'confirmed',
  },
  {
    id: 'sample-4',
    resourceTypeName: 'Pickleball Simulator',
    resourceLabel: 'Sim 1',
    dateLabel: 'Aug 24, 2026, 5:30 PM',
    status: 'cancelled',
  },
  {
    id: 'sample-5',
    resourceTypeName: 'Tennis Simulator',
    resourceLabel: 'Sim 1',
    dateLabel: 'Aug 18, 2026, 9:00 AM',
    status: 'confirmed',
  },
  {
    id: 'sample-6',
    resourceTypeName: 'Pickleball Court',
    resourceLabel: 'Court 3',
    dateLabel: 'Aug 10, 2026, 6:30 PM',
    status: 'confirmed',
  },
  {
    id: 'sample-7',
    resourceTypeName: 'Golf Simulator',
    resourceLabel: 'Bay 2',
    dateLabel: 'Aug 3, 2026, 8:00 AM',
    status: 'confirmed',
  },
  {
    id: 'sample-8',
    resourceTypeName: 'Tennis Court',
    resourceLabel: 'Court 1',
    dateLabel: 'Jul 27, 2026, 4:00 PM',
    status: 'cancelled',
  },
  {
    id: 'sample-9',
    resourceTypeName: 'Golf Simulator',
    resourceLabel: 'Bay 2',
    dateLabel: 'Jul 20, 2026, 10:00 AM',
    status: 'confirmed',
  },
  {
    id: 'sample-10',
    resourceTypeName: 'Pickleball Court',
    resourceLabel: 'Court 1',
    dateLabel: 'Jul 14, 2026, 6:00 PM',
    status: 'confirmed',
  },
  {
    id: 'sample-11',
    resourceTypeName: 'Tennis Simulator',
    resourceLabel: 'Sim 1',
    dateLabel: 'Jul 8, 2026, 7:30 AM',
    status: 'cancelled',
  },
  {
    id: 'sample-12',
    resourceTypeName: 'Pickleball Simulator',
    resourceLabel: 'Sim 2',
    dateLabel: 'Jul 1, 2026, 5:00 PM',
    status: 'confirmed',
  },
  {
    id: 'sample-13',
    resourceTypeName: 'Golf Simulator',
    resourceLabel: 'Bay 1',
    dateLabel: 'Jun 24, 2026, 9:30 AM',
    status: 'confirmed',
  },
  {
    id: 'sample-14',
    resourceTypeName: 'Pickleball Court',
    resourceLabel: 'Court 2',
    dateLabel: 'Jun 17, 2026, 6:00 PM',
    status: 'confirmed',
  },
  {
    id: 'sample-15',
    resourceTypeName: 'Tennis Court',
    resourceLabel: 'Court 1',
    dateLabel: 'Jun 10, 2026, 4:30 PM',
    status: 'confirmed',
  },
  {
    id: 'sample-16',
    resourceTypeName: 'Pickleball Simulator',
    resourceLabel: 'Sim 1',
    dateLabel: 'Jun 3, 2026, 8:00 AM',
    status: 'cancelled',
  },
  {
    id: 'sample-17',
    resourceTypeName: 'Golf Simulator',
    resourceLabel: 'Bay 2',
    dateLabel: 'May 27, 2026, 7:00 PM',
    status: 'confirmed',
  },
  {
    id: 'sample-18',
    resourceTypeName: 'Pickleball Court',
    resourceLabel: 'Court 3',
    dateLabel: 'May 20, 2026, 10:00 AM',
    status: 'confirmed',
  },
  {
    id: 'sample-19',
    resourceTypeName: 'Tennis Simulator',
    resourceLabel: 'Sim 1',
    dateLabel: 'May 13, 2026, 5:00 PM',
    status: 'confirmed',
  },
  {
    id: 'sample-20',
    resourceTypeName: 'Pickleball Court',
    resourceLabel: 'Court 1',
    dateLabel: 'May 6, 2026, 9:00 AM',
    status: 'cancelled',
  },
]

const PAGE_SIZE = 10

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  pending_payment: 'Pending Payment',
}

function sportIconFor(resourceTypeName: string) {
  const label = resourceTypeName.toLowerCase()
  if (label.includes('golf')) return GolfIcon
  if (label.includes('pickleball')) return PickleballIcon
  return TennisIcon
}

export default function RecentBookingsList() {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(SAMPLE_BOOKINGS.length / PAGE_SIZE)
  const pageBookings = SAMPLE_BOOKINGS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-6 shadow-card">
      <h2 className="font-serif text-xl text-brand-dark">Recent Bookings</h2>
      <div className="mt-2 overflow-x-hidden">
        <dl className="flex flex-col">
          {pageBookings.map((booking, index) => {
            const SportIcon = sportIconFor(booking.resourceTypeName)
            return (
            <div
              key={booking.id}
              className={`flex items-center justify-between gap-4 rounded-lg px-2 py-3 -mx-2 transition-colors duration-300 hover:bg-brand-dark/[0.02] ${index > 0 ? 'border-t border-brand-dark/10' : ''}`}
            >
              <dt className="flex items-center gap-3 text-brand-dark/70">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                  <SportIcon className="h-4 w-4" />
                </span>
                <span>
                  {booking.resourceTypeName} — {booking.resourceLabel}
                </span>
              </dt>
              <dd className="flex flex-col items-end text-right">
                <span className="flex items-center gap-1.5 font-medium text-brand-dark">
                  <CalendarIcon className="h-3.5 w-3.5 text-brand-dark/50" />
                  {booking.dateLabel}
                </span>
                <span className="mt-0.5 text-xs uppercase tracking-wide text-accent-primary">
                  {STATUS_LABELS[booking.status]}
                </span>
              </dd>
            </div>
            )
          })}
        </dl>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-brand-dark/10 pt-4">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="rounded-lg border border-brand-dark/20 px-4 py-2 text-sm font-medium text-brand-dark/70 transition-colors duration-300 hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Previous
        </button>
        <span className="text-sm text-brand-dark/60">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="rounded-lg border border-brand-dark/20 px-4 py-2 text-sm font-medium text-brand-dark/70 transition-colors duration-300 hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Next
        </button>
      </div>
    </div>
  )
}
