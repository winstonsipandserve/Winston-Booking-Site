'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  RESCHEDULE_START_CLOSE_HOUR,
  RESCHEDULE_START_OPEN_HOUR,
  RESCHEDULE_TIME_STEP_MINUTES,
  toPhDateString,
} from '@/lib/business-hours'
import { AlertTriangleIcon } from '@/components/admin/AdminIcons'

interface BusyRange { start: string; end: string }
interface PendingReschedule { newDate: string; newStartTime: string; reason: string }

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function dateString(year: number, month: number, day: number) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`
}

function timeLabel(value: string) {
  const [hourString, minute] = value.split(':')
  const hour = Number(hourString)
  return `${hour % 12 || 12}:${minute} ${hour < 12 ? 'AM' : 'PM'}`
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(new Date(`${value}T12:00:00+08:00`))
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none"><path d="m7 9 5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" /><path d="M12 7.5v5l3.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CalendarPicker({ selectedDate, onSelectDate }: { selectedDate: string | null; onSelectDate: (date: string) => void }) {
  const today = useMemo(() => toPhDateString(new Date()), [])
  const [todayYear, todayMonth] = useMemo(() => {
    const [year, month] = today.split('-').map(Number)
    return [year, month - 1]
  }, [today])
  const [viewYear, setViewYear] = useState(todayYear)
  const [viewMonth, setViewMonth] = useState(todayMonth)
  const currentMonth = viewYear === todayYear && viewMonth === todayMonth
  const firstDay = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay()
  const days = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate()
  const cells = [...Array.from({ length: firstDay }, () => null), ...Array.from({ length: days }, (_, index) => index + 1)]

  function previousMonth() {
    if (currentMonth) return
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  return (
    <section aria-labelledby="reschedule-calendar-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 id="reschedule-calendar-heading" className="text-sm font-semibold text-gray-900 dark:text-gray-100">Calendar</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{selectedDate ? dateLabel(selectedDate) : 'Choose a new booking date'}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"><CalendarIcon /></span>
      </div>
      <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button type="button" onClick={previousMonth} disabled={currentMonth} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-35 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100">
            <ChevronIcon className="h-3.5 w-3.5 rotate-90" /> Prev
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{MONTHS[viewMonth]} {viewYear}</span>
          <button type="button" onClick={nextMonth} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100">
            Next <ChevronIcon className="h-3.5 w-3.5 -rotate-90" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-gray-500 dark:text-gray-400">
          {WEEKDAYS.map((day) => <span key={day} className="py-1">{day}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, index) => {
            if (!day) return <span key={`blank-${index}`} aria-hidden="true" />
            const value = dateString(viewYear, viewMonth, day)
            const past = value < today
            const selected = value === selectedDate
            return (
              <button
                key={value}
                type="button"
                disabled={past}
                aria-label={dateLabel(value)}
                aria-pressed={selected}
                onClick={() => onSelectDate(value)}
                className={[
                  'h-8 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 dark:focus:ring-gray-500 dark:focus:ring-offset-gray-800',
                  selected ? 'bg-gray-900 font-semibold text-white dark:bg-gray-100 dark:text-gray-900' : past ? 'cursor-not-allowed text-gray-300 dark:text-gray-600' : 'text-gray-700 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100',
                ].join(' ')}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function RescheduleForm({
  bookingId,
  referenceNumber,
  durationMinutes,
}: {
  bookingId: string
  referenceNumber: string
  durationMinutes: number
}) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [newStartTime, setNewStartTime] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState<BusyRange[]>([])
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingReschedule, setPendingReschedule] = useState<PendingReschedule | null>(null)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const confirmationInputRef = useRef<HTMLInputElement>(null)
  const requiredPhrase = `reschedule ${referenceNumber}`

  useEffect(() => {
    if (!selectedDate) return
    const date = selectedDate

    const controller = new AbortController()
    async function loadAvailability() {
      try {
        const response = await fetch(
          `/api/admin/bookings/${bookingId}/availability?date=${encodeURIComponent(date)}`,
          { signal: controller.signal, cache: 'no-store' },
        )
        if (!response.ok) throw new Error('Failed to load availability')
        const data = await response.json() as { busy: BusyRange[] }
        if (!controller.signal.aborted) setBusy(data.busy)
      } catch {
        if (!controller.signal.aborted) setAvailabilityError('Could not check availability. Try again before selecting a time.')
      } finally {
        if (!controller.signal.aborted) setIsLoadingAvailability(false)
      }
    }

    void loadAvailability()
    return () => controller.abort()
  }, [bookingId, retryCount, selectedDate])

  const timeOptions = useMemo(() => {
    if (!selectedDate) return []
    const now = new Date()
    const busyRanges = busy.map((range) => ({ start: new Date(range.start), end: new Date(range.end) }))
    const count = ((RESCHEDULE_START_CLOSE_HOUR - RESCHEDULE_START_OPEN_HOUR) * 60) / RESCHEDULE_TIME_STEP_MINUTES + 1

    return Array.from({ length: count }, (_, index) => {
      const minutes = RESCHEDULE_START_OPEN_HOUR * 60 + index * RESCHEDULE_TIME_STEP_MINUTES
      const value = `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`
      const start = new Date(`${selectedDate}T${value}:00+08:00`)
      const end = new Date(start.getTime() + durationMinutes * 60_000)
      const overlaps = busyRanges.some((range) => start < range.end && end > range.start)
      return { value, label: timeLabel(value), unavailable: isLoadingAvailability || Boolean(availabilityError) || start <= now || overlaps }
    })
  }, [availabilityError, busy, durationMinutes, isLoadingAvailability, selectedDate])

  const closeConfirmation = useCallback(() => {
    if (isSubmitting) return
    setIsConfirmationOpen(false)
    setPendingReschedule(null)
    setConfirmationText('')
    setError(null)
  }, [isSubmitting])

  useEffect(() => {
    if (!isConfirmationOpen) return
    confirmationInputRef.current?.focus()
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) closeConfirmation()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [closeConfirmation, isConfirmationOpen, isSubmitting])

  function selectDate(date: string) {
    if (date === selectedDate) {
      setBusy([])
      setAvailabilityError(null)
      setIsLoadingAvailability(true)
      setRetryCount((count) => count + 1)
      return
    }
    setBusy([])
    setAvailabilityError(null)
    setIsLoadingAvailability(true)
    setSelectedDate(date)
    setNewStartTime('')
    setError(null)
  }

  function retryAvailability() {
    setBusy([])
    setAvailabilityError(null)
    setIsLoadingAvailability(true)
    setRetryCount((count) => count + 1)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!selectedDate) return setError('Choose a new date.')
    if (isLoadingAvailability) return setError('Wait for available times to load.')
    if (availabilityError) return setError('Check availability before rescheduling.')
    if (!newStartTime) return setError('Choose an available new start time.')
    if (!reason.trim()) return setError('Enter the reason for this reschedule.')
    setPendingReschedule({ newDate: selectedDate, newStartTime, reason: reason.trim() })
    setConfirmationText('')
    setIsConfirmationOpen(true)
  }

  async function confirm() {
    if (!pendingReschedule) return
    if (confirmationText.trim() !== requiredPhrase) {
      setError(`Type "${requiredPhrase}" to continue.`)
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pendingReschedule, confirmationPhrase: requiredPhrase }),
      })
      if (response.status === 200) {
        setIsConfirmationOpen(false)
        setPendingReschedule(null)
        setConfirmationText('')
        setSelectedDate(null)
        setNewStartTime('')
        setReason('')
        router.refresh()
        return
      }
      if (response.status === 400 || response.status === 409) {
        const data = await response.json() as { error: string }
        setError(data.error)
        if (response.status === 409) retryAvailability()
        return
      }
      setError('Something went wrong. Please try again.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableCount = timeOptions.filter((option) => !option.unavailable).length

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-6">
        <CalendarPicker selectedDate={selectedDate} onSelectDate={selectDate} />
        <section aria-labelledby="reschedule-time-heading" className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 id="reschedule-time-heading" className="text-sm font-semibold text-gray-900 dark:text-gray-100">Time</h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Available start times from 6:00–10:00 AM</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"><ClockIcon /></span>
          </div>
          {!selectedDate ? (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/70 px-5 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">Choose a date to view available start times.</div>
          ) : isLoadingAvailability ? (
            <div aria-live="polite" className="flex min-h-48 items-center justify-center rounded-lg border border-gray-200 bg-gray-50/70 px-5 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">Checking available times…</div>
          ) : availabilityError ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50/70 px-5 text-center dark:border-red-900/60 dark:bg-red-950/30">
              <p className="text-sm text-red-700 dark:text-red-300">{availabilityError}</p>
              <button type="button" onClick={retryAvailability} className="mt-3 rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/40">Try again</button>
            </div>
          ) : availableCount === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/70 px-5 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">No available start times on this date. Choose another date.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Available start times">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.unavailable}
                  aria-pressed={newStartTime === option.value}
                  onClick={() => {
                    setNewStartTime(option.value)
                    setError(null)
                  }}
                  className={[
                    'rounded-md border px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed dark:focus:ring-gray-500 dark:focus:ring-offset-gray-900',
                    newStartTime === option.value ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900' : option.unavailable ? 'border-gray-100 bg-gray-50 text-gray-300 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-600' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-800',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Reason</span>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} required rows={3} placeholder="Why does this booking need to move?" className="min-h-24 resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-500 dark:focus:ring-gray-700" />
      </label>

      {error && !isConfirmationOpen && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting || isLoadingAvailability || Boolean(availabilityError)} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">Reschedule</button>
      </div>

      {isConfirmationOpen && pendingReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="reschedule-confirmation-title" aria-describedby="reschedule-confirmation-description" className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"><AlertTriangleIcon /></span>
              <div>
                <h2 id="reschedule-confirmation-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">Confirm reschedule</h2>
                <p id="reschedule-confirmation-description" className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">Move this booking to <span className="font-semibold text-gray-900 dark:text-gray-100">{dateLabel(pendingReschedule.newDate)} at {timeLabel(pendingReschedule.newStartTime)}</span> and notify the customer. To continue, type <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{requiredPhrase}</span> below.</p>
              </div>
            </div>
            <label htmlFor="reschedule-confirmation" className="mt-5 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-700 dark:text-gray-300">
              Confirmation phrase
              <input ref={confirmationInputRef} id="reschedule-confirmation" value={confirmationText} onChange={(event) => { setConfirmationText(event.target.value); setError(null) }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void confirm() } }} placeholder={requiredPhrase} autoComplete="off" className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-500 dark:focus:ring-gray-700" />
            </label>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={isSubmitting} onClick={closeConfirmation} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
              <button type="button" disabled={isSubmitting} onClick={confirm} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">Confirm reschedule</button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
