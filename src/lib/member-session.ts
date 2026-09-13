import type { Customer } from '@prisma/client'
import { auth } from '../../auth'
import { prisma } from '@/lib/prisma'
import { isSessionRevokedByPasswordChange } from '@/lib/session-revocation'

/**
 * The member counterpart of getActiveAdminSession: every member-gated page and route goes
 * through this so a deleted customer or a password reset fails closed everywhere at once.
 */
export async function getActiveMemberSession(): Promise<{ customer: Customer } | null> {
  const session = await auth()
  if (session?.user?.role !== 'member' || !session.user.id) return null
  const customer = await prisma.customer.findUnique({ where: { id: session.user.id } })
  if (!customer) return null
  if (isSessionRevokedByPasswordChange(session.user.authAt, customer.passwordChangedAt)) return null
  return { customer }
}
