import { Prisma } from '@prisma/client'
import { auth } from '../../../../../../../auth'
import { prisma } from '@/lib/prisma'
import { isWithinBusinessHours } from '@/lib/business-hours'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isExclusionViolation(err: unknown): boolean {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    const message = err.message ?? ''
    return message.includes('booking_no_overlap') || message.includes('exclusion constraint')
  }
  return false
}

interface RescheduleRequestBody {
  newDate?: unknown
  newStartTime?: unknown
  reason?: unknown
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: RescheduleRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { newDate, newStartTime, reason } = body
  if (
    !isNonEmptyString(newDate) ||
    !isNonEmptyString(newStartTime) ||
    !isNonEmptyString(reason)
  ) {
    return Response.json({ error: 'Missing or malformed required fields' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking) {
    return Response.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.status !== 'confirmed') {
    return Response.json(
      { error: 'Only confirmed bookings can be rescheduled' },
      { status: 400 },
    )
  }

  const newStart = new Date(`${newDate}T${newStartTime}:00+08:00`)
  if (Number.isNaN(newStart.getTime())) {
    return Response.json({ error: 'newDate/newStartTime must form a valid date and time' }, { status: 400 })
  }

  const durationMs = booking.endTime.getTime() - booking.startTime.getTime()
  const newEnd = new Date(newStart.getTime() + durationMs)

  if (!isWithinBusinessHours(newStart, newEnd)) {
    return Response.json(
      { error: 'Bookings must start and end between 6:00 AM and 10:00 PM' },
      { status: 400 },
    )
  }

  try {
    await prisma.$transaction(async (tx) => {
      const originalStart = booking.startTime
      const originalEnd = booking.endTime

      await tx.booking.update({
        where: { id: booking.id },
        data: { startTime: newStart, endTime: newEnd },
      })

      await tx.bookingReschedule.create({
        data: {
          bookingId: booking.id,
          originalStart,
          originalEnd,
          newStart,
          newEnd,
          reason,
          performedById: session.user.id,
        },
      })
    })
  } catch (err) {
    console.error('Booking reschedule failed', err)
    if (isExclusionViolation(err)) {
      return Response.json({ error: 'That slot is no longer available.' }, { status: 409 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json({ id: booking.id, startTime: newStart, endTime: newEnd }, { status: 200 })
}
