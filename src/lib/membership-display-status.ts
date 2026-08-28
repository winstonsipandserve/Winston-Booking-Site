import type { ApplicationStatus } from '@prisma/client'

export type MembershipDisplayStatus = 'pending' | 'awaiting_payment' | 'active' | 'rejected'

export function getMembershipDisplayStatus(application: {
  status: ApplicationStatus
  membership: unknown | null
}): MembershipDisplayStatus {
  if (application.status === 'pending') return 'pending'
  if (application.status === 'rejected') return 'rejected'
  return application.membership ? 'active' : 'awaiting_payment'
}

export const MEMBERSHIP_DISPLAY_STATUS_LABELS: Record<MembershipDisplayStatus, string> = {
  pending: 'Pending',
  awaiting_payment: 'Approved — Awaiting Payment',
  active: 'Active Member',
  rejected: 'Rejected',
}

export const MEMBERSHIP_DISPLAY_STATUS_CLASSES: Record<MembershipDisplayStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  awaiting_payment: 'bg-blue-100 text-blue-800',
  active: 'bg-gray-900 text-white',
  rejected: 'bg-red-100 text-red-800',
}
