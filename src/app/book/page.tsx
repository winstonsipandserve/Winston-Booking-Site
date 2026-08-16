'use client'

import { useState } from 'react'
import AnnouncementGate from '@/components/booking/AnnouncementGate'
import BookingForm from '@/components/booking/BookingForm'

export default function BookPage() {
  const [started, setStarted] = useState(false)

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
      {started ? <BookingForm /> : <AnnouncementGate onContinue={() => setStarted(true)} />}
    </div>
  )
}
