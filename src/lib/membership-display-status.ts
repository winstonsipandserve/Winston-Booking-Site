import type { ApplicationStatus } from '@prisma/client'

export type MembershipDisplayStatus = 'pending' | 'awaiting_payment' | 'active' | 'expired' | 'rejected'

export function getMembershipDisplayStatus(application: {
  status: ApplicationStatus
  latestMembership: { endDate: Date } | null
}): MembershipDisplayStatus {
  if (application.status === 'pending') return 'pending'
  if (application.status === 'rejected') return 'rejected'
  if (!application.latestMembership) return 'awaiting_payment'
  return application.latestMembership.endDate >= new Date() ? 'active' : 'expired'
}

export const MEMBERSHIP_DISPLAY_STATUS_LABELS: Record<MembershipDisplayStatus, string> = {
  pending: 'Pending',
  awaiting_payment: 'Approved — Awaiting Payment',
  active: 'Active Member',
  expired: 'Expired',
  rejected: 'Rejected',
}

export const MEMBERSHIP_DISPLAY_STATUS_CLASSES: Record<MembershipDisplayStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  awaiting_payment: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  active: 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
  expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}
