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
    <div>
      <h1>Bookings</h1>

      <nav style={{ margin: '1rem 0', display: 'flex', gap: '1rem' }}>
        {STATUS_FILTERS.map((filter) => {
          const isActive = filter.value === 'all' ? !statusParam : statusParam === filter.value
          const href =
            filter.value === 'all' ? '/admin/bookings' : `/admin/bookings?status=${filter.value}`
          return (
            <Link key={filter.value} href={href}>
              {isActive ? `[${filter.label}]` : filter.label}
            </Link>
          )
        })}
      </nav>

      <table border={1} cellPadding={6} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Resource</th>
            <th>Customer</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>
                <Link href={`/admin/bookings/${booking.id}`}>{booking.id}</Link>
              </td>
              <td>
                {booking.resource.resourceType.name} — {booking.resource.label}
              </td>
              <td>{booking.customer ? booking.customer.name : '—'}</td>
              <td>{booking.startTime.toLocaleString('en-PH')}</td>
              <td>{booking.endTime.toLocaleString('en-PH')}</td>
              <td>{booking.status}</td>
              <td>{formatCentavos(booking.totalAmountCentavos)}</td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={7}>No bookings found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        {page > 1 && (
          <Link href={`/admin/bookings?${statusQuery}${statusQuery ? '&' : ''}page=${page - 1}`}>
            Prev
          </Link>
        )}
        <span>
          Page {page} of {totalPages}
        </span>
        {page < totalPages && (
          <Link href={`/admin/bookings?${statusQuery}${statusQuery ? '&' : ''}page=${page + 1}`}>
            Next
          </Link>
        )}
      </div>
    </div>
  )
}
