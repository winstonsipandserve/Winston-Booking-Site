'use client'

import { useState } from 'react'
import { TennisIcon, PickleballIcon, GolfIcon, CalendarIcon } from '@/components/ui/Icons'

export type BookingListItem = {
  id: string
  resourceTypeName: string
  resourceLabel: string
  dateLabel: string
  status: 'confirmed' | 'cancelled' | 'pending_payment'
}

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

export default function RecentBookingsList({ bookings }: { bookings: BookingListItem[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageBookings = bookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const placeholderCount = PAGE_SIZE - Math.max(pageBookings.length, 1)

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
                className={`-mx-2 flex h-[68px] items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors duration-300 hover:bg-brand-dark/[0.02] ${index > 0 ? 'border-t border-brand-dark/10' : ''}`}
              >
                <dt className="flex min-w-0 flex-1 items-center gap-3 text-brand-dark/70">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                    <SportIcon className="h-4 w-4" />
                  </span>
                  <span className="truncate">
                    {booking.resourceTypeName} — {booking.resourceLabel}
                  </span>
                </dt>
                <dd className="flex max-w-[56%] shrink-0 flex-col items-end text-right">
                  <span className="flex items-start gap-1.5 text-xs font-medium text-brand-dark">
                    <CalendarIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-dark/50" />
                    {booking.dateLabel}
                  </span>
                  <span className="mt-0.5 text-xs uppercase tracking-wide text-accent-primary">
                    {STATUS_LABELS[booking.status]}
                  </span>
                </dd>
              </div>
            )
          })}

          {bookings.length === 0 && (
            <div className="flex h-[68px] items-center px-2 text-sm text-brand-dark/60">
              No bookings yet.
            </div>
          )}

          {Array.from({ length: placeholderCount }).map((_, index) => (
            <div
              key={`booking-placeholder-${index}`}
              aria-hidden="true"
              className="h-[68px] border-t border-brand-dark/10"
            />
          ))}
        </dl>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-brand-dark/10 pt-4">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="rounded-none border border-brand-dark/20 px-4 py-2 text-sm font-medium text-brand-dark/70 transition-colors duration-300 hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Previous
        </button>
        <span className="text-sm text-brand-dark/60">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="rounded-none border border-brand-dark/20 px-4 py-2 text-sm font-medium text-brand-dark/70 transition-colors duration-300 hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Next
        </button>
      </div>
    </div>
  )
}
