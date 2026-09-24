'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BUSINESS_CLOSE_HOUR, BUSINESS_OPEN_HOUR, toPhDateString } from '@/lib/business-hours'

interface BusyRange {
  start: string
  end: string
}

interface TimeSlotGridProps {
  selectedDate: string
  resourceCategory: string
  resourceSlug: string
  durationMinutes: number
  busy: BusyRange[]
  loading: boolean
  selectedSlot: string | null
  onSelectSlot: (startTimeIso: string) => void
}

interface Slot {
  startIso: string
  startDate: Date
  label: string
  disabled: boolean
  exceedsClosing: boolean
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatLabel(minutesOfDay: number): string {
  const hour24 = Math.floor(minutesOfDay / 60)
  const minute = minutesOfDay % 60
  const period = hour24 < 12 ? 'AM' : 'PM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12}:${pad2(minute)} ${period}`
}

function granularityFor(resourceCategory: string, resourceSlug: string): number {
  if (resourceCategory === 'court') return 60
  if (resourceSlug === 'golf_sim') return 30
  return 15
}

export default function TimeSlotGrid({
  selectedDate,
  resourceCategory,
  resourceSlug,
  durationMinutes,
  busy,
  loading,
  selectedSlot,
  onSelectSlot,
}: TimeSlotGridProps) {
  const slots = useMemo<Slot[]>(() => {
    if (!selectedDate || !durationMinutes) return []

    const granularity = granularityFor(resourceCategory, resourceSlug)
    const openMinutes = BUSINESS_OPEN_HOUR * 60
    const closeMinutes = BUSINESS_CLOSE_HOUR * 60
    const now = new Date()
    const isToday = selectedDate === toPhDateString(now)

    const busyRanges = busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }))

    const result: Slot[] = []
    for (let m = openMinutes; m <= closeMinutes; m += granularity) {
      const hh = Math.floor(m / 60)
      const mm = m % 60
      const startIso = `${selectedDate}T${pad2(hh)}:${pad2(mm)}:00+08:00`
      const startDate = new Date(startIso)
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000)

      const overlapsBusy = busyRanges.some((b) => startDate < b.end && endDate > b.start)
      const isPast = isToday && startDate <= now
      const exceedsClosing = m + durationMinutes > closeMinutes

      result.push({
        startIso,
        startDate,
        label: formatLabel(m),
        disabled: overlapsBusy || isPast,
        exceedsClosing,
      })
    }
    return result
  }, [selectedDate, durationMinutes, resourceCategory, resourceSlug, busy])

  const [closingWarning, setClosingWarning] = useState<string | null>(null)
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleClosingViolation(slot: Slot) {
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    const closeLabel = formatLabel(BUSINESS_CLOSE_HOUR * 60)
    setClosingWarning(
      `A ${durationMinutes}-minute booking can't start at ${slot.label} — we close at ${closeLabel}. Try an earlier time or a shorter duration.`
    )
    warningTimeoutRef.current = setTimeout(() => setClosingWarning(null), 4000)
  }

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    }
  }, [])

  if (loading) {
    return (
      <p className="text-sm text-gray-500">Loading available times…</p>
    )
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No times available this day.
      </p>
    )
  }

  const selectedRange = selectedSlot
    ? {
        start: new Date(selectedSlot),
        end: new Date(new Date(selectedSlot).getTime() + durationMinutes * 60000),
      }
    : null

  return (
    <div className="flex flex-col gap-2">
      {closingWarning && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {closingWarning}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const isInSelectedRange =
            selectedRange !== null &&
            slot.startDate >= selectedRange.start &&
            slot.startDate <= selectedRange.end
          return (
            <button
              key={slot.startIso}
              type="button"
              disabled={slot.disabled}
              onClick={() => {
                if (slot.exceedsClosing) {
                  handleClosingViolation(slot)
                  return
                }
                onSelectSlot(slot.startIso)
              }}
              className={`rounded-md px-2 py-2 text-sm transition-colors ${
                isInSelectedRange
                  ? 'border-2 border-gray-900 bg-gray-50 font-semibold text-gray-900'
                  : slot.disabled
                    ? 'cursor-not-allowed border border-gray-200 text-gray-300'
                    : slot.exceedsClosing
                      ? 'border border-amber-400 text-amber-700 hover:bg-amber-50'
                      : 'border border-gray-200 text-gray-900 hover:bg-gray-50'
              } ${slot.disabled ? 'cursor-not-allowed' : ''}`}
            >
              {slot.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
