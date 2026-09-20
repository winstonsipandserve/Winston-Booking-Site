import type { MembershipTier } from '@prisma/client'

export function formatMembershipTier(tier: MembershipTier): string {
  switch (tier) {
    case 'player':
      return 'Winston Player'
    case 'premier':
      return 'Winston Premier'
    case 'elite':
      return 'Winston Elite'
  }
}

export function formatCentavos(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Whole-peso display for plan prices that never carry centavos, e.g. "₱6,500". */
export function formatWholePesos(centavos: number): string {
  return `₱${Math.round(centavos / 100).toLocaleString('en-PH')}`
}

export function parseCentavos(pesosInput: string): number | null {
  const trimmed = pesosInput.trim()
  if (trimmed === '') return null
  const value = Number(trimmed)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value * 100)
}

/** Short Manila calendar date — "Sep 21, 2026". The default for any date without a time. */
export function formatManilaDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(date)
}

export function formatBulletinDate(date: Date): string {
  return formatManilaDate(date)
}

/** Manila clock time only — "1:00 PM". */
export function formatManilaTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila',
  }).format(date)
}

/**
 * Manila slot range — "Sep 21, 2026 · 1:00 PM – 2:00 PM". Falls back to two full
 * date-times when the slot crosses midnight.
 */
export function formatManilaTimeRange(start: Date, end: Date): string {
  const sameDay = formatManilaDate(start) === formatManilaDate(end)
  if (!sameDay) return `${formatBookingDateTime(start)} – ${formatBookingDateTime(end)}`
  return `${formatManilaDate(start)} · ${formatManilaTime(start)} – ${formatManilaTime(end)}`
}

/** Long Manila date used wherever a membership expiry is shown (account, check-in, emails, wizard). */
export function formatMembershipExpiryDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
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
