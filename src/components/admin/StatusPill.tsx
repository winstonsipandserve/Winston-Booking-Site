import type { BookingStatus } from '@prisma/client'
import { BOOKING_STATUS_CLASSES, BOOKING_STATUS_LABELS } from '@/lib/booking-display-status'
import {
  MEMBERSHIP_DISPLAY_STATUS_CLASSES,
  MEMBERSHIP_DISPLAY_STATUS_LABELS,
  type MembershipDisplayStatus,
} from '@/lib/membership-display-status'

// Single pill shape for every status in the admin so tables and detail headers scan the same way.
export default function StatusPill({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

export function BookingStatusPill({ status }: { status: BookingStatus }) {
  return <StatusPill label={BOOKING_STATUS_LABELS[status]} className={BOOKING_STATUS_CLASSES[status]} />
}

export function MembershipStatusPill({ status }: { status: MembershipDisplayStatus }) {
  return (
    <StatusPill
      label={MEMBERSHIP_DISPLAY_STATUS_LABELS[status]}
      className={MEMBERSHIP_DISPLAY_STATUS_CLASSES[status]}
    />
  )
}
