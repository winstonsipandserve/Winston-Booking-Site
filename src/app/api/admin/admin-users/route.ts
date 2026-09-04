import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminUsers = await prisma.adminUser.findMany({
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return Response.json(adminUsers, { status: 200 })
}
