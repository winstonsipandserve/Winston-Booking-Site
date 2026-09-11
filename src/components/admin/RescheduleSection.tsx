'use client'

import { useState } from 'react'
import { AlertTriangleIcon } from '@/components/admin/AdminIcons'
import RescheduleForm from '@/components/admin/RescheduleForm'

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function RescheduleSection({
  bookingId,
  durationMinutes,
}: {
  bookingId: string
  durationMinutes: number
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/40">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
          <AlertTriangleIcon className="h-4 w-4 shrink-0" />
          <span>
            <span className="block">Reschedule</span>
            {!isOpen && <span className="mt-0.5 block text-xs font-normal text-amber-700/70 dark:text-amber-400/70">Choose a new slot</span>}
          </span>
        </span>
        <ChevronIcon
          className={`h-4 w-4 shrink-0 text-amber-700 transition-transform duration-200 dark:text-amber-400 ${
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
