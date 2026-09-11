'use client'

import { useMemo, useState } from 'react'
import { toPhDateString } from '@/lib/business-hours'
import type { BookingCalendarData, BookingCalendarEntry } from '@/lib/dashboard-data'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function monthParts(month: string): [number, number] {
  const [year, monthNumber] = month.split('-').map(Number)
  return [year, monthNumber - 1]
}

function monthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

function shiftMonth(month: string, offset: number): string {
  const [year, monthIndex] = monthParts(month)
  const shifted = new Date(Date.UTC(year, monthIndex + offset, 1))
  return monthKey(shifted.getUTCFullYear(), shifted.getUTCMonth())
}

function dateKey(year: number, monthIndex: number, day: number): string {
  return `${monthKey(year, monthIndex)}-${String(day).padStart(2, '0')}`
}

function formatMonth(month: string): string {
  const [year, monthIndex] = monthParts(month)
  return MONTH_FORMATTER.format(new Date(Date.UTC(year, monthIndex, 1)))
}

function activityClass(count: number): string {
  if (count === 0) return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  if (count === 1) return 'bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-100'
  if (count <= 3) return 'bg-blue-300 text-blue-950 dark:bg-blue-800 dark:text-blue-50'
  if (count <= 5) return 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white'
  return 'bg-blue-700 text-white dark:bg-blue-400 dark:text-blue-950'
}

function bookingCountLabel(date: string, count: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
  return `${formattedDate}: ${count} confirmed booking${count === 1 ? '' : 's'}`
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
      <path
        d={direction === 'left' ? 'm14.5 5-7 7 7 7' : 'm9.5 5 7 7-7 7'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DashboardBookingCalendar({ initialCalendar }: { initialCalendar: BookingCalendarData }) {
  const [calendar, setCalendar] = useState(initialCalendar)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = useMemo(() => toPhDateString(new Date()), [])

  const [year, monthIndex] = monthParts(calendar.month)
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay()
  const totalDays = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const countsByDate = new Map(calendar.bookings.map((entry: BookingCalendarEntry) => [entry.date, entry.count]))
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, index) => index + 1),
  ]

  async function navigate(offset: number) {
    if (isLoading) return

    const nextMonth = shiftMonth(calendar.month, offset)
    setError(null)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/dashboard/booking-calendar?month=${nextMonth}`)
      if (!response.ok) throw new Error('Unable to load booking activity')
      const nextCalendar: BookingCalendarData = await response.json()
      setCalendar(nextCalendar)
    } catch {
      setError('Could not load that month. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900" aria-labelledby="booking-calendar-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="booking-calendar-heading" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Booking Calendar
        </h2>
        <div className="flex items-center gap-1" aria-label="Calendar month navigation">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isLoading}
            aria-label="Previous month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-wait disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:outline-gray-100"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => navigate(1)}
            disabled={isLoading}
            aria-label="Next month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-wait disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:outline-gray-100"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>

      <p className="mb-3 text-center text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100" aria-live="polite">
        {formatMonth(calendar.month)}
      </p>

      <div className="grid grid-cols-7 justify-items-center gap-x-1.5 gap-y-1" aria-label={`${formatMonth(calendar.month)} confirmed booking activity`}>
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="pb-0.5 text-center text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {label}
          </div>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <div key={`blank-${index}`} className="h-7 w-7" aria-hidden="true" />

          const date = dateKey(year, monthIndex, day)
          const count = countsByDate.get(date) ?? 0
          const isToday = date === today
          return (
            <time
              key={date}
              dateTime={date}
              title={bookingCountLabel(date, count)}
              aria-label={bookingCountLabel(date, count)}
              className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium tabular-nums transition-colors ${activityClass(count)} ${
                isToday ? 'ring-2 ring-gray-900 ring-offset-2 ring-offset-white dark:ring-gray-100 dark:ring-offset-gray-900' : ''
              }`}
            >
              {day}
            </time>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
        <span>Less</span>
        {[0, 1, 2, 4, 6].map((count) => (
          <span key={count} className={`h-3 w-3 rounded-sm ${activityClass(count)}`} aria-hidden="true" />
        ))}
        <span>More</span>
      </div>

      {error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </section>
  )
}
