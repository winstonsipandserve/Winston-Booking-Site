import { auth } from '../../auth'
import { prisma } from '@/lib/prisma'
import { isSessionRevokedByPasswordChange } from '@/lib/session-revocation'

export async function getActiveAdminSession() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return null
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, isActive: true, passwordChangedAt: true },
  })
  if (!adminUser?.isActive) return null
  if (isSessionRevokedByPasswordChange(session.user.authAt, adminUser.passwordChangedAt)) return null
  return { session, adminUser }
}
