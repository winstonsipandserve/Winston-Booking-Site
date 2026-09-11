import { getActiveAdminSession } from '@/lib/admin-session'
import { phDateToUtcWindow } from '@/lib/business-hours'
import { occupyingSlotCondition } from '@/lib/booking-hold'
import { prisma } from '@/lib/prisma'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date || !DATE_PATTERN.test(date)) {
    return Response.json({ error: 'date must be in YYYY-MM-DD format' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, resourceId: true, status: true },
  })

  if (!booking) {
    return Response.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.status !== 'confirmed') {
    return Response.json({ error: 'Only confirmed bookings can be rescheduled' }, { status: 400 })
  }

  const { start: windowStart, end: windowEnd } = phDateToUtcWindow(date)
  const bookings = await prisma.booking.findMany({
    where: {
      AND: [
        {
          resourceId: booking.resourceId,
          id: { not: booking.id },
          startTime: { lt: windowEnd },
          endTime: { gt: windowStart },
        },
        occupyingSlotCondition(new Date()),
      ],
    },
    orderBy: { startTime: 'asc' },
    select: { startTime: true, endTime: true },
  })

  return Response.json(
    {
      busy: bookings.map((item) => ({
        start: item.startTime.toISOString(),
        end: item.endTime.toISOString(),
      })),
    },
    { status: 200 },
  )
}
