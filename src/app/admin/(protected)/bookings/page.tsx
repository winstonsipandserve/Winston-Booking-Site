import Link from 'next/link'
import type { BookingStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatCentavos } from '@/lib/format'

const PAGE_SIZE = 25
const STATUS_FILTERS: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending_payment', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function isBookingStatus(value: string): value is BookingStatus {
  return value === 'pending_payment' || value === 'confirmed' || value === 'cancelled'
}

function formatDateTime(start: Date, end: Date) {
  const date = start.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }
  const time = `${start.toLocaleTimeString('en-PH', timeOptions)} – ${end.toLocaleTimeString(
    'en-PH',
    timeOptions
  )}`
  return { date, time }
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status: statusParam, page: pageParam } = await searchParams

  const status = statusParam && isBookingStatus(statusParam) ? statusParam : undefined
  const page = Math.max(1, Number(pageParam) || 1)

  const where: Prisma.BookingWhereInput = status ? { status } : {}

  const [bookings, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        resource: { include: { resourceType: true } },
        customer: true,
      },
      orderBy: { startTime: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const statusQuery = statusParam ? `status=${statusParam}` : ''

  return (
    <div className="flex h-full flex-col gap-4">
      <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap items-center gap-1">
          {STATUS_FILTERS.map((filter) => {
            const isActive = filter.value === 'all' ? !statusParam : statusParam === filter.value
            const href =
              filter.value === 'all' ? '/admin/bookings' : `/admin/bookings?status=${filter.value}`
            return (
              <Link
                key={filter.value}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-900 font-semibold text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filter.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search bookings…"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
          />
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Search
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Resource
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Customer
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Date &amp; Time
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Status
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Total
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const { date, time } = formatDateTime(booking.startTime, booking.endTime)
              return (
                <tr key={booking.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-900">
                    {booking.resource.resourceType.name} — {booking.resource.label}
                  </td>
                  <td className="px-4 py-2.5 text-gray-900">
                    {booking.customer ? booking.customer.name : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-900">
                    <div>{date}</div>
                    <div className="text-gray-500">{time}</div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-900">{booking.status}</td>
                  <td className="px-4 py-2.5 text-gray-900">
                    {formatCentavos(booking.totalAmountCentavos)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )
            })}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        {page > 1 && (
          <Link
            href={`/admin/bookings?${statusQuery}${statusQuery ? '&' : ''}page=${page - 1}`}
            className="font-medium text-gray-900 hover:underline"
          >
            Prev
          </Link>
        )}
        <span>
          Page {page} of {totalPages}
        </span>
        {page < totalPages && (
          <Link
            href={`/admin/bookings?${statusQuery}${statusQuery ? '&' : ''}page=${page + 1}`}
            className="font-medium text-gray-900 hover:underline"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  )
}
