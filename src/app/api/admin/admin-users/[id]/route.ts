import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

interface UpdateAdminUserBody {
  isActive?: unknown
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

  let body: UpdateAdminUserBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { isActive } = body
  if (typeof isActive !== 'boolean') {
    return Response.json({ error: 'isActive must be a boolean' }, { status: 400 })
  }

  const target = await prisma.adminUser.findUnique({ where: { id } })
  if (!target) {
    return Response.json({ error: 'Admin user not found' }, { status: 404 })
  }

  if (id === activeSession.adminUser.id) {
    return Response.json(
      { error: 'You cannot change your own active status here.' },
      { status: 400 },
    )
  }

  if (target.isActive && !isActive) {
    const activeCount = await prisma.adminUser.count({ where: { isActive: true } })
    if (activeCount <= 1) {
      return Response.json(
        { error: 'Cannot deactivate the last remaining active admin.' },
        { status: 400 },
      )
    }
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data: { isActive },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
  })

  return Response.json(updated, { status: 200 })
}
