'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" /><path d="M12 7.5v5l3.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export default function RescheduleForm({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(form)
    const newDate = formData.get('newDate')
    const newStartTime = formData.get('newStartTime')
    const reason = formData.get('reason')

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate, newStartTime, reason }),
      })

      if (res.status === 200) {
        router.refresh()
        form.reset()
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="group flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-amber-900/70 dark:text-amber-200/70">
            New date
            <span className="relative flex min-h-[76px] items-center gap-3 rounded-lg border border-amber-200 bg-white/70 px-3 transition-colors focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200 dark:border-amber-900/60 dark:bg-gray-900/40 dark:focus-within:border-amber-600 dark:focus-within:ring-amber-900/50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"><CalendarIcon /></span>
              <input name="newDate" type="date" required aria-label="New date" className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-medium normal-case tracking-normal text-gray-900 outline-none dark:text-gray-100" />
            </span>
          </label>
          <label className="group flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-amber-900/70 dark:text-amber-200/70">
            New start time
            <span className="relative flex min-h-[76px] items-center gap-3 rounded-lg border border-amber-200 bg-white/70 px-3 transition-colors focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200 dark:border-amber-900/60 dark:bg-gray-900/40 dark:focus-within:border-amber-600 dark:focus-within:ring-amber-900/50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"><ClockIcon /></span>
              <input name="newStartTime" type="time" required aria-label="New start time" className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-medium normal-case tracking-normal text-gray-900 outline-none dark:text-gray-100" />
            </span>
          </label>
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

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {isSubmitting ? 'Rescheduling…' : 'Reschedule'}
          </button>
        </div>
      </form>
  )
}
