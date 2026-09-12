'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ANNOUNCEMENT_URGENCY_LABELS } from '@/lib/announcement-validation'

export type GateNotice = {
  id: string
  title: string
  message: string
  urgency: 'info' | 'warning' | 'urgent'
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
  info: 'border-notice-info-border bg-notice-info-bg text-notice-info-text',
  warning: 'border-notice-warning-border bg-notice-warning-bg text-notice-warning-text',
  urgent: 'border-notice-urgent-border bg-notice-urgent-bg text-notice-urgent-text',
}

function PagerButton({ label, disabled, onClick, children }: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-dark/20 text-brand-dark transition-colors hover:border-accent-primary hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-brand-dark/20 disabled:hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary">
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
    <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-card border border-brand-dark/10 bg-brand-light shadow-hero md:h-[calc(100vh-7.5rem)] md:max-h-[52rem] md:min-h-[34rem] md:flex-row">
      <aside className="flex flex-col bg-brand-dark px-8 py-8 md:w-[36%] md:shrink-0 md:px-10 md:py-10">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent-light/70">Step 1 of 2</span>
        <h2 className="mt-4 font-serif text-3xl leading-tight text-accent-light md:text-4xl">Before you book</h2>
        <p className="mt-4 text-sm leading-relaxed text-brand-light/80">
          Check these current court and bay notices, then continue to choose your slot.
        </p>
        <div className="mt-8 border-t border-brand-light/20 pt-6 md:mt-auto">
          <p className="flex items-baseline gap-3 text-brand-light/80">
            <span className="font-serif text-4xl leading-none text-accent-light">{count}</span>
            <span className="text-sm">{count === 1 ? 'active notice' : 'active notices'}</span>
          </p>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        {count > 0 ? (
          <ul className="flex-1 divide-y divide-brand-dark/10 overflow-y-auto">
            {visible.map((notice) => (
              <li key={notice.id} className="flex flex-col gap-2 px-6 py-4 md:px-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${URGENCY_STYLES[notice.urgency]}`}>
                    {ANNOUNCEMENT_URGENCY_LABELS[notice.urgency]}
                  </span>
                  <span className="font-mono text-xs text-brand-dark/50">
                    {notice.endAt ? `${notice.startAt} – ${notice.endAt}` : `From ${notice.startAt}`}
                  </span>
                </div>
                <h3 className="font-serif text-lg leading-snug text-brand-dark md:text-xl">{notice.title}</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{notice.message}</p>
                {notice.affectedResources.length > 0 && (
                  <p className="rounded-control border border-brand-dark/10 bg-background/70 px-3 py-2 text-sm text-brand-dark">
                    <span className="font-semibold">Affected:</span> {notice.affectedResources.join(', ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex-1 px-6 py-8 text-sm text-neutral-700 md:px-8">
            No notices right now. Everything currently listed is open and bookable.
          </p>
        )}

        <div className="flex flex-col gap-4 border-t border-brand-dark/10 bg-background/60 px-6 py-5 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-brand-dark/70">
              Already a member?{' '}
              <Link href="/login" className="font-medium text-accent-primary underline underline-offset-2">Sign in</Link>{' '}
              for member rates and priority booking.
            </p>
            {pageCount > 1 && (
              <div className="flex items-center gap-2">
                <PagerButton label="Previous notices" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </PagerButton>
                <span className="font-mono text-xs text-brand-dark/50">{currentPage + 1} / {pageCount}</span>
                <PagerButton label="Next notices" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </PagerButton>
              </div>
            )}
          </div>
          <button type="button" onClick={onContinue} className="w-full rounded-none bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light">
            Continue to Booking
          </button>
        </div>
      </div>
    </div>
  )
}
