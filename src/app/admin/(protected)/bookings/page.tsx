import Link from 'next/link'
import type { BookingStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatCentavos } from '@/lib/format'
import { phDateToUtcWindow } from '@/lib/business-hours'
import BookingsFilterModal from '@/components/admin/BookingsFilterModal'

const PAGE_SIZE = 25

function isBookingStatus(value: string): value is BookingStatus {
  return value === 'pending_payment' || value === 'confirmed' || value === 'cancelled'
}

function formatSubmittedAt(createdAt: Date) {
  const date = createdAt.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const time = createdAt.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
  return { date, time }
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; startDate?: string; endDate?: string }>
}) {
  const { status: statusParam, page: pageParam, startDate, endDate } = await searchParams

  const status = statusParam && isBookingStatus(statusParam) ? statusParam : undefined
  const page = Math.max(1, Number(pageParam) || 1)

  const where: Prisma.BookingWhereInput = {}
  if (status) {
    where.status = status
  }
  if (startDate || endDate) {
    where.startTime = {
      ...(startDate ? { gte: phDateToUtcWindow(startDate).start } : {}),
      ...(endDate ? { lt: phDateToUtcWindow(endDate).end } : {}),
    }
  }

  const [bookings, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        resource: { include: { resourceType: true } },
        customer: true,
      },
      relationLoadStrategy: 'query',
      orderBy: { startTime: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const filterParams = new URLSearchParams()
  if (statusParam) filterParams.set('status', statusParam)
  if (startDate) filterParams.set('startDate', startDate)
  if (endDate) filterParams.set('endDate', endDate)

  function pageHref(targetPage: number) {
    const params = new URLSearchParams(filterParams)
    params.set('page', String(targetPage))
    return `/admin/bookings?${params.toString()}`
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookingsFilterModal
            status={status ?? 'all'}
            startDate={startDate ?? ''}
            endDate={endDate ?? ''}
          />
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Export
          </button>
        </div>

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
        <table className="w-full min-w-[840px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Reference
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Resource
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Customer
              </th>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                Submitted
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
              const { date, time } = formatSubmittedAt(booking.createdAt)
              return (
                <tr key={booking.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{booking.id}</td>
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
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No bookings found.
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
