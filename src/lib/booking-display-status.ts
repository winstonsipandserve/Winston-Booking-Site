import type { BookingStatus } from '@prisma/client'

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending_payment: 'Pending Payment',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

// Mirrors MEMBERSHIP_DISPLAY_STATUS_CLASSES so status pills read the same across the admin:
// amber = waiting on the customer, solid = live, muted grey = closed out.
export const BOOKING_STATUS_CLASSES: Record<BookingStatus, string> = {
  pending_payment: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  confirmed: 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
  cancelled: 'bg-gray-100 text-gray-500 line-through dark:bg-gray-800 dark:text-gray-400',
}
