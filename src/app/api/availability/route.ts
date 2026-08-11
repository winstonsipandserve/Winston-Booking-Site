import { prisma } from '@/lib/prisma'
import { occupyingSlotCondition } from '@/lib/booking-hold'
import { phDateToUtcWindow } from '@/lib/business-hours'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const resourceId = searchParams.get('resourceId')
  const date = searchParams.get('date')

  if (!resourceId || !date) {
    return Response.json({ error: 'resourceId and date are required' }, { status: 400 })
  }
  if (!DATE_PATTERN.test(date)) {
    return Response.json({ error: 'date must be in YYYY-MM-DD format' }, { status: 400 })
  }

  const { start: windowStart, end: windowEnd } = phDateToUtcWindow(date)

  const bookings = await prisma.booking.findMany({
    where: {
      AND: [
        {
          resourceId,
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
      busy: bookings.map((b) => ({
        start: b.startTime.toISOString(),
        end: b.endTime.toISOString(),
      })),
    },
    { status: 200 },
  )
}
