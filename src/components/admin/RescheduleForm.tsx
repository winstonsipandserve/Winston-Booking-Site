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
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      <h3>Reschedule</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="newDate">New date</label>
        <br />
        <input id="newDate" name="newDate" type="date" required />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="newStartTime">New start time</label>
        <br />
        <input id="newStartTime" name="newStartTime" type="time" required />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="reason">Reason</label>
        <br />
        <textarea id="reason" name="reason" required style={{ width: '100%', maxWidth: 400 }} />
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Rescheduling…' : 'Reschedule'}
      </button>
    </form>
  )
}
