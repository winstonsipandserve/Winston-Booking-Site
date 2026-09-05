'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function RescheduleForm({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
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
        e.currentTarget.reset()
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
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Reschedule</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
          New date
          <input
            name="newDate"
            type="date"
            required
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
          New start time
          <input
            name="newStartTime"
            type="time"
            required
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
          Reason
          <textarea
            name="reason"
            required
            rows={3}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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
    </section>
  )
}
