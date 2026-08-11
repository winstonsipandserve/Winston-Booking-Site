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
