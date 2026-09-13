// Calendar-day arithmetic in Asia/Manila. Manila has no DST, so a fixed +08:00 offset
// is exact and lets us avoid pulling in a timezone library for a handful of helpers.

const MANILA_UTC_OFFSET = '+08:00'

const manilaDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Manila',
})

/** `YYYY-MM-DD` of the given instant as seen on a Manila calendar. */
export function manilaDateKey(date: Date): string {
  return manilaDateKeyFormatter.format(date)
}

function parseDateKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split('-').map(Number)
  return { year, month, day }
}

/** 00:00:00.000 Manila on the calendar day that contains `date`. */
export function startOfManilaDay(date: Date): Date {
  return new Date(`${manilaDateKey(date)}T00:00:00.000${MANILA_UTC_OFFSET}`)
}

/** 23:59:59.999 Manila on the calendar day that contains `date`. */
export function endOfManilaDay(date: Date): Date {
  return new Date(`${manilaDateKey(date)}T23:59:59.999${MANILA_UTC_OFFSET}`)
}

/**
 * Whole calendar days from `from` to `to` on the Manila calendar, ignoring time of day.
 * Same day → 0, tomorrow → 1, yesterday → -1.
 */
export function manilaCalendarDaysBetween(from: Date, to: Date): number {
  const a = parseDateKey(manilaDateKey(from))
  const b = parseDateKey(manilaDateKey(to))
  const aUtc = Date.UTC(a.year, a.month - 1, a.day)
  const bUtc = Date.UTC(b.year, b.month - 1, b.day)
  return Math.round((bUtc - aUtc) / 86_400_000)
}

/**
 * Adds calendar months to the Manila date of `date` and returns the end of that Manila day.
 * Month-end overflow follows JavaScript's `setUTCMonth` (Jan 31 + 1 month → Mar 3 / Mar 2).
 */
export function endOfManilaDayMonthsFrom(date: Date, months: number): Date {
  const { year, month, day } = parseDateKey(manilaDateKey(date))
  const shifted = new Date(Date.UTC(year, month - 1 + months, day))
  return new Date(`${shifted.toISOString().slice(0, 10)}T23:59:59.999${MANILA_UTC_OFFSET}`)
}
