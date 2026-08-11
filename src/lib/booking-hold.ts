import { Prisma } from '@prisma/client'

export const HOLD_MINUTES = Number(process.env.BOOKING_HOLD_MINUTES) || 10

/**
 * True when a booking counts as currently holding/occupying its slot:
 * confirmed, or a pending_payment hold that hasn't gone stale yet.
 */
export function occupyingSlotCondition(now: Date): Prisma.BookingWhereInput {
  const holdCutoff = new Date(now.getTime() - HOLD_MINUTES * 60000)
  return {
    OR: [
      { status: 'confirmed' },
      { status: 'pending_payment', createdAt: { gte: holdCutoff } },
    ],
  }
}
