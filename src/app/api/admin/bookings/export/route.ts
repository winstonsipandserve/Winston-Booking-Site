import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { formatCentavos, formatBookingDateTime } from '@/lib/format'
import { bookingGrandTotalCentavos } from '@/lib/booking-pricing'
import { isBookingStatus, buildBookingsWhere } from '@/lib/bookings-query'
import { buildCsv } from '@/lib/csv'
import { toPhDateString } from '@/lib/business-hours'

export async function GET(request: Request) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status') ?? undefined
  const startDate = searchParams.get('startDate') ?? undefined
  const endDate = searchParams.get('endDate') ?? undefined
  const search = searchParams.get('search') ?? undefined
  const status = statusParam && isBookingStatus(statusParam) ? statusParam : undefined

  const where = buildBookingsWhere({ status, startDate, endDate, search })

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      resource: { include: { resourceType: true } },
      addOns: { select: { amountCentavos: true } },
      payment: { select: { paymongoPaymentId: true, paymongoNetAmountCentavos: true } },
      customer: { select: { email: true } },
    },
    relationLoadStrategy: 'query',
    orderBy: { startTime: 'asc' },
  })

  const headers = ['Reference', 'Resource', 'Customer', 'Customer Email', 'Customer Phone', 'Submitted', 'Status', 'Total', 'Net', 'PayMongo Payment ID']
  const rows = bookings.map((b) => [
    b.id,
    `${b.resource.resourceType.name} — ${b.resource.label}`,
    b.customerNameSnapshot ?? '',
    b.customer?.email ?? '',
    b.customerPhoneSnapshot ?? '',
    formatBookingDateTime(b.createdAt),
    b.status,
    formatCentavos(bookingGrandTotalCentavos(b)),
    b.payment?.paymongoNetAmountCentavos != null ? formatCentavos(b.payment.paymongoNetAmountCentavos) : '',
    b.payment?.paymongoPaymentId ?? '',
  ])

  const csv = buildCsv(headers, rows)
  const dateStr = toPhDateString(new Date())
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bookings-export-${dateStr}.csv"`,
    },
  })
}
