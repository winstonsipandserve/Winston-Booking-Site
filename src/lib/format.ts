import type { MembershipTier } from '@prisma/client'

export function formatMembershipTier(tier: MembershipTier): string {
  switch (tier) {
    case 'three_month':
      return '3-Month'
    case 'six_month':
      return '6-Month'
    case 'twelve_month':
      return '12-Month'
  }
}

export function formatCentavos(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function parseCentavos(pesosInput: string): number | null {
  const trimmed = pesosInput.trim()
  if (trimmed === '') return null
  const value = Number(trimmed)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value * 100)
}

export function formatBulletinDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(date)
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(date)
}

export function formatBookingDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila',
  }).format(date)
}
