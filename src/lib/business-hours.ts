export const BUSINESS_OPEN_HOUR = 6
export const BUSINESS_CLOSE_HOUR = 22

/** Minutes since PH midnight for the given absolute instant (PH = fixed UTC+8, no DST). */
export function toPhMinutesOfDay(date: Date): number {
  const phShifted = new Date(date.getTime() + 8 * 60 * 60000)
  return phShifted.getUTCHours() * 60 + phShifted.getUTCMinutes()
}

export function isWithinBusinessHours(start: Date, end: Date): boolean {
  if (end <= start) return false
  const startMinutes = toPhMinutesOfDay(start)
  const endMinutes = toPhMinutesOfDay(end)
  return startMinutes >= BUSINESS_OPEN_HOUR * 60 && endMinutes <= BUSINESS_CLOSE_HOUR * 60
}

/** Converts a PH calendar date ("YYYY-MM-DD") to its UTC start/end instants (PH midnight that date → PH midnight next date). */
export function phDateToUtcWindow(dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split('-').map(Number)
  return {
    start: new Date(Date.UTC(y, m - 1, d, -8, 0, 0)),
    end: new Date(Date.UTC(y, m - 1, d, 16, 0, 0)),
  }
}

/** The PH calendar date ("YYYY-MM-DD") that the given absolute instant falls on. */
export function toPhDateString(date: Date): string {
  const phShifted = new Date(date.getTime() + 8 * 60 * 60000)
  const y = phShifted.getUTCFullYear()
  const m = String(phShifted.getUTCMonth() + 1).padStart(2, '0')
  const d = String(phShifted.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Monday 00:00 PH through the following Monday 00:00 PH, containing "now". */
export function currentPhWeekWindow(): { start: Date; end: Date } {
  const phShifted = new Date(Date.now() + 8 * 60 * 60000)
  const y = phShifted.getUTCFullYear()
  const m = phShifted.getUTCMonth()
  const d = phShifted.getUTCDate()
  const daysSinceMonday = (phShifted.getUTCDay() + 6) % 7
  return {
    start: new Date(Date.UTC(y, m, d - daysSinceMonday, -8, 0, 0)),
    end: new Date(Date.UTC(y, m, d - daysSinceMonday + 7, -8, 0, 0)),
  }
}

/** 1st of the current PH month through 1st of next PH month. */
export function currentPhMonthWindow(): { start: Date; end: Date } {
  const phShifted = new Date(Date.now() + 8 * 60 * 60000)
  const y = phShifted.getUTCFullYear()
  const m = phShifted.getUTCMonth()
  return {
    start: new Date(Date.UTC(y, m, 1, -8, 0, 0)),
    end: new Date(Date.UTC(y, m + 1, 1, -8, 0, 0)),
  }
}

/** UTC instant of the 1st of the PH month `monthsAgo` months before the current PH month (0 = current month start). */
export function phMonthStartUtc(monthsAgo: number): Date {
  const phShifted = new Date(Date.now() + 8 * 60 * 60000)
  const y = phShifted.getUTCFullYear()
  const m = phShifted.getUTCMonth()
  return new Date(Date.UTC(y, m - monthsAgo, 1, -8, 0, 0))
}

/** The "YYYY-MM" PH calendar month the given absolute instant falls in. */
export function toPhMonthKey(date: Date): string {
  const phShifted = new Date(date.getTime() + 8 * 60 * 60000)
  const y = phShifted.getUTCFullYear()
  const m = String(phShifted.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
