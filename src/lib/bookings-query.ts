import type { BookingStatus, Prisma } from '@prisma/client'
import { phDateToUtcWindow } from '@/lib/business-hours'

export function isBookingStatus(value: string): value is BookingStatus {
  return value === 'pending_payment' || value === 'confirmed' || value === 'cancelled'
}

export function buildBookingsWhere({
  status,
  startDate,
  endDate,
  search,
}: {
  status?: BookingStatus
  startDate?: string
  endDate?: string
  search?: string
}): Prisma.BookingWhereInput {
  const where: Prisma.BookingWhereInput = {}
  if (status) {
    where.status = status
  }
  if (startDate || endDate) {
    where.startTime = {
      ...(startDate ? { gte: phDateToUtcWindow(startDate).start } : {}),
      ...(endDate ? { lt: phDateToUtcWindow(endDate).end } : {}),
    }
  }
  const trimmedSearch = search?.trim()
  if (trimmedSearch) {
    where.OR = [
      { id: { contains: trimmedSearch, mode: 'insensitive' } },
      { customer: { name: { contains: trimmedSearch, mode: 'insensitive' } } },
      { resource: { label: { contains: trimmedSearch, mode: 'insensitive' } } },
      { resource: { resourceType: { name: { contains: trimmedSearch, mode: 'insensitive' } } } },
    ]
  }
  return where
}
