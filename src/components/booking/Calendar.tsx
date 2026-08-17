'use client'

import { useMemo, useState } from 'react'
import { toPhDateString } from '@/lib/business-hours'

interface CalendarProps {
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function toDateString(y: number, monthIndex: number, d: number): string {
  return `${y}-${pad2(monthIndex + 1)}-${pad2(d)}`
}

function daysInMonth(y: number, monthIndex: number): number {
  return new Date(Date.UTC(y, monthIndex + 1, 0)).getUTCDate()
}

function firstWeekday(y: number, monthIndex: number): number {
  return new Date(Date.UTC(y, monthIndex, 1)).getUTCDay()
}

export default function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const todayStr = useMemo(() => toPhDateString(new Date()), [])
  const [todayYear, todayMonth] = useMemo(() => {
    const [y, m] = todayStr.split('-').map(Number)
    return [y, m - 1]
  }, [todayStr])

  const [viewYear, setViewYear] = useState(todayYear)
  const [viewMonth, setViewMonth] = useState(todayMonth)

  const isAtCurrentMonth = viewYear === todayYear && viewMonth === todayMonth

  function goPrevMonth() {
    if (isAtCurrentMonth) return
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const totalDays = daysInMonth(viewYear, viewMonth)
  const leadingBlanks = firstWeekday(viewYear, viewMonth)
  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  return (
    <div className="flex w-full flex-col gap-2 rounded border border-black/[.145] p-3 dark:border-white/[.145]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevMonth}
          disabled={isAtCurrentMonth}
          className="rounded px-2 py-1 text-sm font-medium hover:bg-black/[.03] disabled:opacity-30 dark:hover:bg-white/[.04]"
        >
          ← Prev
        </button>
        <span className="text-sm font-medium">
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={goNextMonth}
          className="rounded px-2 py-1 text-sm font-medium hover:bg-black/[.03] dark:hover:bg-white/[.04]"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-600 dark:text-zinc-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} />
          }
          const dateStr = toDateString(viewYear, viewMonth, day)
          const isPast = dateStr < todayStr
          const isSelected = dateStr === selectedDate

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast}
              aria-disabled={isPast}
              onClick={() => onSelectDate(dateStr)}
              className={`rounded py-2 text-sm transition-colors ${
                isPast
                  ? 'cursor-not-allowed text-zinc-400 dark:text-zinc-600'
                  : 'hover:bg-black/[.05] dark:hover:bg-white/[.08]'
              } ${
                isSelected
                  ? 'bg-foreground text-background hover:bg-foreground'
                  : ''
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
