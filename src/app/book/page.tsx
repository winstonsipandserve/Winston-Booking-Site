'use client'

import { useEffect, useState } from 'react'
import AnnouncementGate from '@/components/booking/AnnouncementGate'
import BookingForm, { type ResourcesResponse } from '@/components/booking/BookingForm'

export default function BookPage() {
  const [started, setStarted] = useState(false)
  const [data, setData] = useState<ResourcesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/resources')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load resources')
        return res.json() as Promise<ResourcesResponse>
      })
      .then((json) => {
        if (cancelled) return
        setData(json)
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load resources. Please refresh the page.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-background px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-brand-dark">
          Book a Court or Simulator
        </h1>
        <p className="max-w-md text-neutral-700">
          Pick your sport, date, and time to get an instant booking reference — payment details
          come after.
        </p>
      </div>
      {started ? (
        <BookingForm data={data} loading={loading} loadError={loadError} />
      ) : (
        <AnnouncementGate onContinue={() => setStarted(true)} />
      )}
    </div>
  )
}
