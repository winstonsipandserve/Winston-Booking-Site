import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

function parsePositiveInt(value: string | null, fallback: number, max?: number): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return max ? Math.min(parsed, max) : parsed
}

export async function GET(request: Request) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parsePositiveInt(searchParams.get('page'), 1)
  const pageSize = parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const [logs, totalCount] = await Promise.all([
    prisma.adminActivityLog.findMany({
      include: { admin: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.adminActivityLog.count(),
  ])

  const items = logs.map((log) => ({
    id: log.id,
    adminName: log.admin.name,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    description: log.description,
    createdAt: log.createdAt,
  }))

  return Response.json({ items, page, pageSize, totalCount }, { status: 200 })
}
