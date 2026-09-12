import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

interface UpdateResourceBody {
  label?: unknown
  isActive?: unknown
  /** Free-text admin note (e.g. "Under renovation") — not the structured disabledReason enum. */
  disabledNote?: unknown
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
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

  const { label, isActive, disabledNote } = body
  if (label !== undefined && !isNonEmptyString(label)) {
    return Response.json({ error: 'label must be a non-empty string' }, { status: 400 })
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return Response.json({ error: 'isActive must be a boolean' }, { status: 400 })
  }
  if (disabledNote !== undefined && disabledNote !== null && typeof disabledNote !== 'string') {
    return Response.json({ error: 'disabledNote must be a string or null' }, { status: 400 })
  }
  if (label === undefined && isActive === undefined && disabledNote === undefined) {
    return Response.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Re-enabling always clears any prior disabled note, regardless of what's in the body.
  let disabledNoteToSet: string | null | undefined
  if (isActive === true) {
    disabledNoteToSet = null
  } else if (disabledNote !== undefined) {
    disabledNoteToSet = disabledNote === null ? null : (disabledNote as string).trim() || null
  }

  // A manual toggle always wins immediately, regardless of any announcement claim.
  // Setting isActive:false stamps
  // disabledReason: 'manual'; setting isActive:true clears it, same as disabledNote.
  let disabledReasonToSet: 'manual' | null | undefined
  if (isActive === true) {
    disabledReasonToSet = null
  } else if (isActive === false) {
    disabledReasonToSet = 'manual'
  }

  const resource = await prisma.resource.update({
    where: { id },
    data: {
      ...(label !== undefined ? { label: (label as string).trim() } : {}),
      ...(isActive !== undefined ? { isActive: isActive as boolean } : {}),
      ...(disabledNoteToSet !== undefined ? { disabledNote: disabledNoteToSet } : {}),
      ...(disabledReasonToSet !== undefined ? { disabledReason: disabledReasonToSet } : {}),
    },
  })

  return Response.json(resource, { status: 200 })
}
