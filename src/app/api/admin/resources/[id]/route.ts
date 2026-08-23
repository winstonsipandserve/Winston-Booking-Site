import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

interface UpdateResourceBody {
  label?: unknown
  isActive?: unknown
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.resource.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Resource not found' }, { status: 404 })
  }

  let body: UpdateResourceBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { label, isActive } = body
  if (label !== undefined && !isNonEmptyString(label)) {
    return Response.json({ error: 'label must be a non-empty string' }, { status: 400 })
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return Response.json({ error: 'isActive must be a boolean' }, { status: 400 })
  }
  if (label === undefined && isActive === undefined) {
    return Response.json({ error: 'No fields to update' }, { status: 400 })
  }

  const resource = await prisma.resource.update({
    where: { id },
    data: {
      ...(label !== undefined ? { label: (label as string).trim() } : {}),
      ...(isActive !== undefined ? { isActive: isActive as boolean } : {}),
    },
  })

  return Response.json(resource, { status: 200 })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.resource.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Resource not found' }, { status: 404 })
  }

  const deletedBookings = await prisma.$transaction(async (tx) => {
    const bookings = await tx.booking.findMany({ where: { resourceId: id }, select: { id: true } })
    const bookingIds = bookings.map((b) => b.id)

    if (bookingIds.length > 0) {
      await tx.payment.deleteMany({ where: { bookingId: { in: bookingIds } } })
      await tx.bookingReschedule.deleteMany({ where: { bookingId: { in: bookingIds } } })
      await tx.bookingAddOn.deleteMany({ where: { bookingId: { in: bookingIds } } })
      await tx.booking.deleteMany({ where: { id: { in: bookingIds } } })
    }

    await tx.resource.delete({ where: { id } })

    return bookingIds.length
  })

  return Response.json({ deletedBookings }, { status: 200 })
}
