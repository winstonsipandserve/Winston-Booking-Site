'use client'

import { useState } from 'react'
import AnnouncementGate from '@/components/booking/AnnouncementGate'
import BookingForm from '@/components/booking/BookingForm'

export default function BookPage() {
  const [started, setStarted] = useState(false)

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Book a Court or Simulator
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          Fill in your details below to hold a slot. Our team will follow up to confirm payment.
        </p>
      </div>
      {started ? <BookingForm /> : <AnnouncementGate onContinue={() => setStarted(true)} />}
    </div>
  )
}
