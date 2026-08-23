import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

interface CreateResourceBody {
  resourceTypeId?: unknown
  label?: unknown
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: CreateResourceBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { resourceTypeId, label } = body
  if (!isNonEmptyString(resourceTypeId) || !isNonEmptyString(label)) {
    return Response.json({ error: 'Missing or malformed required fields' }, { status: 400 })
  }

  const resourceType = await prisma.resourceType.findUnique({ where: { id: resourceTypeId } })
  if (!resourceType) {
    return Response.json({ error: 'Invalid resourceTypeId' }, { status: 400 })
  }

  const resource = await prisma.resource.create({
    data: { resourceTypeId, label: label.trim(), isActive: true },
  })

  return Response.json(resource, { status: 201 })
}
