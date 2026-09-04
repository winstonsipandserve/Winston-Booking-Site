import { auth } from '../../auth'
import { prisma } from '@/lib/prisma'

export async function getActiveAdminSession() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return null
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, isActive: true },
  })
  if (!adminUser?.isActive) return null
  return { session, adminUser }
}
