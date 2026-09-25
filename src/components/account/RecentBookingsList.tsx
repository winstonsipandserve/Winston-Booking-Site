'use client'

import { useState } from 'react'
import {
  TennisIcon,
  PickleballIcon,
  GolfIcon,
  LoungeIcon,
  ConferenceRoomIcon,
  CalendarIcon,
} from '@/components/ui/Icons'

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
  if (label.includes('lounge')) return LoungeIcon
  if (label.includes('conference')) return ConferenceRoomIcon
  return TennisIcon
}

export default function RecentBookingsList({ bookings }: { bookings: BookingListItem[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageBookings = bookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const placeholderCount = PAGE_SIZE - Math.max(pageBookings.length, 1)

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white px-6 py-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>

      <div className="mt-2 overflow-x-hidden">
        <dl className="flex flex-col">
          {pageBookings.map((booking, index) => {
            const SportIcon = sportIconFor(booking.resourceTypeName)
            return (
              <div
                key={booking.id}
                className={`-mx-2 flex h-[68px] items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors duration-300 hover:bg-gray-50 ${index > 0 ? 'border-t border-gray-200' : ''}`}
              >
                <dt className="flex min-w-0 flex-1 items-center gap-3 text-gray-500">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <SportIcon className="h-4 w-4" />
                  </span>
                  <span className="truncate">
                    {booking.resourceTypeName} — {booking.resourceLabel}
                  </span>
                </dt>
                <dd className="flex max-w-[56%] shrink-0 flex-col items-end text-right">
                  <span className="flex items-start gap-1.5 text-xs font-medium text-gray-900">
                    <CalendarIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    {booking.dateLabel}
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">
                    {STATUS_LABELS[booking.status]}
                  </span>
                </dd>
              </div>
            )
          })}

          {bookings.length === 0 && (
            <div className="flex h-[68px] items-center px-2 text-sm text-gray-500">
              No bookings yet.
            </div>
          )}

          {Array.from({ length: placeholderCount }).map((_, index) => (
            <div
              key={`booking-placeholder-${index}`}
              aria-hidden="true"
              className="h-[68px] border-t border-gray-200"
            />
          ))}
        </dl>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors duration-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Previous
        </button>
        <span className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors duration-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next
        </button>
      </div>
    </div>
  )
}
