'use client'

import { useState } from 'react'
import { BookingsIcon, ChevronDownIcon } from '@/components/admin/AdminIcons'
import RescheduleForm from '@/components/admin/RescheduleForm'

export default function RescheduleSection({
  bookingId,
  durationMinutes,
}: {
  bookingId: string
  durationMinutes: number
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <BookingsIcon className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
          <span>
            <span className="block">Reschedule</span>
            {!isOpen && <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-gray-400">Choose a new slot</span>}
          </span>
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4">
          <RescheduleForm
            bookingId={bookingId}
            referenceNumber={bookingId}
            durationMinutes={durationMinutes}
          />
        </div>
      )}
    </section>
  )
}
