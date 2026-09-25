'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ANNOUNCEMENT_URGENCY_LABELS } from '@/lib/announcement-validation'

export type GateNotice = {
  id: string
  title: string
  message: string
  urgency: 'info' | 'warning' | 'urgent'
  /** The operational window has not started yet; the notice is advance warning. */
  upcoming: boolean
  startAt: string
  endAt: string | null
  affectedResources: string[]
}

interface AnnouncementGateProps {
  notices: GateNotice[]
  onContinue: () => void
}

const PAGE_SIZE = 3

const URGENCY_STYLES: Record<GateNotice['urgency'], string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  urgent: 'border-red-200 bg-red-50 text-red-800',
}

function PagerButton({ label, disabled, onClick, children }: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export default function AnnouncementGate({ notices, onContinue }: AnnouncementGateProps) {
  const [page, setPage] = useState(0)
  const count = notices.length
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const visible = notices.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Before you book</h2>
        <p className="mt-1 text-sm text-gray-500">
          Check these current court, bay, and space notices, then continue to choose your slot.
        </p>
      </div>

      {count > 0 ? (
        <ul className="flex flex-col divide-y divide-gray-200">
          {visible.map((notice) => (
            <li key={notice.id} className="flex flex-col gap-2 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${URGENCY_STYLES[notice.urgency]}`}>
                  {ANNOUNCEMENT_URGENCY_LABELS[notice.urgency]}
                </span>
                <span className="text-xs text-gray-400">
                  {notice.upcoming && <span className="mr-2 font-semibold text-gray-500">Upcoming</span>}
                  {notice.endAt ? `${notice.startAt} – ${notice.endAt}` : `From ${notice.startAt}`}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900">{notice.title}</h3>
              <p className="whitespace-pre-line text-sm text-gray-600">{notice.message}</p>
              {notice.affectedResources.length > 0 && (
                <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <span className="font-semibold">Affected:</span> {notice.affectedResources.join(', ')}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">
          No notices right now. Everything currently listed is open and bookable.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-500">
          Already a member?{' '}
          <Link href="/login" className="font-medium text-gray-900 underline underline-offset-2">Sign in</Link>{' '}
          for member rates and priority booking.
        </p>
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <PagerButton label="Previous notices" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </PagerButton>
            <span className="text-xs text-gray-400">{currentPage + 1} / {pageCount}</span>
            <PagerButton label="Next notices" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </PagerButton>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700"
      >
        Continue to Booking
      </button>
    </div>
  )
}
