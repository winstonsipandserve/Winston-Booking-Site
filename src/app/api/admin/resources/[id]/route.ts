import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

interface UpdateResourceBody {
  label?: unknown
  isActive?: unknown
  disabledReason?: unknown
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

  const { label, isActive, disabledReason } = body
  if (label !== undefined && !isNonEmptyString(label)) {
    return Response.json({ error: 'label must be a non-empty string' }, { status: 400 })
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return Response.json({ error: 'isActive must be a boolean' }, { status: 400 })
  }
  if (disabledReason !== undefined && disabledReason !== null && typeof disabledReason !== 'string') {
    return Response.json({ error: 'disabledReason must be a string or null' }, { status: 400 })
  }
  if (label === undefined && isActive === undefined && disabledReason === undefined) {
    return Response.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Re-enabling always clears any prior disabled reason, regardless of what's in the body.
  let disabledReasonToSet: string | null | undefined
  if (isActive === true) {
    disabledReasonToSet = null
  } else if (disabledReason !== undefined) {
    disabledReasonToSet = disabledReason === null ? null : (disabledReason as string).trim() || null
  }

  const resource = await prisma.resource.update({
    where: { id },
    data: {
      ...(label !== undefined ? { label: (label as string).trim() } : {}),
      ...(isActive !== undefined ? { isActive: isActive as boolean } : {}),
      ...(disabledReasonToSet !== undefined ? { disabledReason: disabledReasonToSet } : {}),
    },
  })

  return Response.json(resource, { status: 200 })
}
