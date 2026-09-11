'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  RESCHEDULE_START_CLOSE_HOUR,
  RESCHEDULE_START_OPEN_HOUR,
  RESCHEDULE_TIME_STEP_MINUTES,
} from '@/lib/business-hours'
import { AlertTriangleIcon } from '@/components/admin/AdminIcons'

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" /><path d="M12 7.5v5l3.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none"><path d="m7 9 5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function formatTimeLabel(time: string): string {
  const [hourString, minute] = time.split(':')
  const hour = Number(hourString)
  const hour12 = hour % 12 || 12
  return `${hour12}:${minute} ${hour < 12 ? 'AM' : 'PM'}`
}

const TIME_OPTIONS = Array.from(
  {
    length:
      ((RESCHEDULE_START_CLOSE_HOUR - RESCHEDULE_START_OPEN_HOUR) * 60) /
        RESCHEDULE_TIME_STEP_MINUTES +
      1,
  },
  (_, index) => {
    const totalMinutes = RESCHEDULE_START_OPEN_HOUR * 60 + index * RESCHEDULE_TIME_STEP_MINUTES
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    return {
      value: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      label: formatTimeLabel(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`),
    }
  },
)

interface PendingReschedule {
  newDate: string
  newStartTime: string
  reason: string
}

export default function RescheduleForm({
  bookingId,
  referenceNumber,
}: {
  bookingId: string
  referenceNumber: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newStartTime, setNewStartTime] = useState('')
  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false)
  const [pendingReschedule, setPendingReschedule] = useState<PendingReschedule | null>(null)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const timePickerRef = useRef<HTMLDivElement>(null)
  const confirmationInputRef = useRef<HTMLInputElement>(null)
  const requiredPhrase = `reschedule ${referenceNumber}`

  const closeConfirmation = useCallback(() => {
    if (isSubmitting) return
    setIsConfirmationOpen(false)
    setPendingReschedule(null)
    setConfirmationText('')
    setError(null)
  }, [isSubmitting])

  useEffect(() => {
    if (!isTimeMenuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!timePickerRef.current?.contains(event.target as Node)) {
        setIsTimeMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isTimeMenuOpen])

  useEffect(() => {
    if (!isConfirmationOpen) return

    confirmationInputRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        closeConfirmation()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeConfirmation, isConfirmationOpen, isSubmitting])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setError(null)

    const formData = new FormData(form)
    const newDate = String(formData.get('newDate') ?? '')
    const reason = String(formData.get('reason') ?? '')

    if (!newStartTime) {
      setError('Please choose a new start time.')
      return
    }

    setPendingReschedule({ newDate, newStartTime, reason })
    setConfirmationText('')
    setIsConfirmationOpen(true)
  }

  async function handleConfirm() {
    if (!pendingReschedule) return

    if (confirmationText.trim() !== requiredPhrase) {
      setError(`Type "${requiredPhrase}" to continue.`)
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pendingReschedule, confirmationPhrase: requiredPhrase }),
      })

      if (res.status === 200) {
        setIsConfirmationOpen(false)
        setPendingReschedule(null)
        setConfirmationText('')
        setNewStartTime('')
        router.refresh()
        formRef.current?.reset()
        return
      }

      if (res.status === 400 || res.status === 409) {
        const json = await res.json()
        setError(json.error)
        return
      }

      setError('Something went wrong. Please try again.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="group flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-amber-900/70 dark:text-amber-200/70">
            New date
            <label htmlFor="new-date" className="relative flex min-h-[76px] items-center gap-3 rounded-lg border border-amber-200 bg-white/70 px-3 transition-colors focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200 dark:border-amber-900/60 dark:bg-gray-900/40 dark:focus-within:border-amber-600 dark:focus-within:ring-amber-900/50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"><CalendarIcon /></span>
              <input id="new-date" name="newDate" type="date" required aria-label="New date" className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-medium normal-case tracking-normal text-gray-900 outline-none dark:text-gray-100" />
            </label>
          </div>
          <div className="group flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-amber-900/70 dark:text-amber-200/70">
            New start time
            <div ref={timePickerRef} className="relative flex min-h-[76px] items-center gap-3 rounded-lg border border-amber-200 bg-white/70 px-3 transition-colors focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200 dark:border-amber-900/60 dark:bg-gray-900/40 dark:focus-within:border-amber-600 dark:focus-within:ring-amber-900/50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"><ClockIcon /></span>
              <input type="hidden" name="newStartTime" value={newStartTime} />
              <button
                type="button"
                aria-label="New start time"
                aria-expanded={isTimeMenuOpen}
                aria-haspopup="listbox"
                onClick={() => setIsTimeMenuOpen((open) => !open)}
                className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left text-sm font-medium normal-case tracking-normal text-gray-900 outline-none dark:text-gray-100"
              >
                <span className={newStartTime ? '' : 'text-gray-400 dark:text-gray-500'}>
                  {newStartTime ? formatTimeLabel(newStartTime) : 'Choose a time'}
                </span>
                <ChevronIcon className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-150 ${isTimeMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isTimeMenuOpen && (
                <div role="listbox" aria-label="Available start times" className="absolute left-3 right-3 top-[calc(100%+0.5rem)] z-30 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                    6:00 AM–10:00 AM
                  </p>
                  <div className="grid max-h-64 grid-cols-2 gap-1 overflow-y-auto">
                    {TIME_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={newStartTime === option.value}
                        onClick={() => {
                          setNewStartTime(option.value)
                          setIsTimeMenuOpen(false)
                        }}
                        className={`rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:hover:bg-gray-800 dark:focus:ring-gray-600 ${
                          newStartTime === option.value
                            ? 'bg-gray-900 font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-[11px] font-normal normal-case tracking-normal text-amber-900/60 dark:text-amber-200/60">
              Start times are limited to 6:00–10:00 AM.
            </p>
          </div>
        </div>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-amber-900/70 dark:text-amber-200/70">
          Reason
          <textarea
            name="reason"
            required
            rows={3}
            className="min-h-24 resize-y rounded-lg border border-amber-200 bg-white/70 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-amber-900/60 dark:bg-gray-900/40 dark:text-gray-100 dark:focus:border-amber-600 dark:focus:ring-amber-900/50"
          />
        </label>

        {error && !isConfirmationOpen && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {isSubmitting ? 'Rescheduling…' : 'Reschedule'}
          </button>
        </div>

        {isConfirmationOpen && pendingReschedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-4" role="presentation">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reschedule-confirmation-title"
              aria-describedby="reschedule-confirmation-description"
              className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  <AlertTriangleIcon />
                </span>
                <div>
                  <h2 id="reschedule-confirmation-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Confirm reschedule
                  </h2>
                  <p id="reschedule-confirmation-description" className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    This will update the booking and notify the customer. To continue, type <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{requiredPhrase}</span> in the field below.
                  </p>
                </div>
              </div>
              <label htmlFor="reschedule-confirmation" className="mt-5 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-700 dark:text-gray-300">
                Confirmation phrase
                <input
                  ref={confirmationInputRef}
                  id="reschedule-confirmation"
                  value={confirmationText}
                  onChange={(event) => {
                    setConfirmationText(event.target.value)
                    setError(null)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void handleConfirm()
                    }
                  }}
                  placeholder={requiredPhrase}
                  autoComplete="off"
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-500 dark:focus:ring-gray-700"
                />
              </label>
              {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={closeConfirmation}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirm}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  {isSubmitting ? 'Confirming…' : 'Confirm reschedule'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
  )
}
