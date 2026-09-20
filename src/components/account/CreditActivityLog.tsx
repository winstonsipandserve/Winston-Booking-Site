'use client'

import { useState } from 'react'
import { CalendarIcon, CoffeeCupIcon, TennisIcon, PickleballIcon, GolfIcon } from '@/components/ui/Icons'

export type CreditActivityItem = {
  id: string
  reason: 'booking_redemption' | 'top_up'
  /** Positive for credit added, negative for credit spent — mirrors the ledger row. */
  amountCentavos: number
  amountLabel: string
  dateLabel: string
  /** Set only for booking redemptions — what the credit paid for. */
  bookingLabel: string | null
}

const PAGE_SIZE = 5

const REASON_LABELS: Record<CreditActivityItem['reason'], string> = {
  booking_redemption: 'Booking paid with credit',
  top_up: 'Credit top-up',
}

function sportIconFor(bookingLabel: string) {
  const label = bookingLabel.toLowerCase()
  if (label.includes('golf')) return GolfIcon
  if (label.includes('pickleball')) return PickleballIcon
  return TennisIcon
}

export default function CreditActivityLog({ entries }: { entries: CreditActivityItem[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageEntries = entries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const placeholderCount = PAGE_SIZE - Math.max(pageEntries.length, 1)

  return (
    <div className="flex flex-col rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-6 shadow-card">
      <h2 className="font-serif text-xl text-brand-dark">Credit Activity</h2>
      <p className="mt-1 text-sm text-brand-dark/60">
        Where your booking credit for this term came from and where it was spent.
      </p>

      <div className="mt-2 overflow-x-hidden">
        <dl className="flex flex-col">
          {pageEntries.map((entry, index) => {
            const isDebit = entry.amountCentavos < 0
            const Icon = entry.bookingLabel ? sportIconFor(entry.bookingLabel) : CoffeeCupIcon
            return (
              <div
                key={entry.id}
                className={`-mx-2 flex h-[68px] items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors duration-300 hover:bg-brand-dark/[0.02] ${index > 0 ? 'border-t border-brand-dark/10' : ''}`}
              >
                <dt className="flex min-w-0 flex-1 items-center gap-3 text-brand-dark/70">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      isDebit ? 'bg-brand-dark/5 text-brand-dark/60' : 'bg-accent-primary/10 text-accent-primary'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{REASON_LABELS[entry.reason]}</span>
                    {entry.bookingLabel && (
                      <span className="truncate text-xs text-brand-dark/50">{entry.bookingLabel}</span>
                    )}
                  </span>
                </dt>
                <dd className="flex max-w-[56%] shrink-0 flex-col items-end text-right">
                  <span
                    className={`text-sm font-medium tabular-nums ${isDebit ? 'text-brand-dark' : 'text-accent-primary'}`}
                  >
                    {isDebit ? '−' : '+'}
                    {entry.amountLabel}
                  </span>
                  <span className="mt-0.5 flex items-start gap-1.5 text-xs text-brand-dark/60">
                    <CalendarIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-dark/50" />
                    {entry.dateLabel}
                  </span>
                </dd>
              </div>
            )
          })}

          {entries.length === 0 && (
            <div className="flex h-[68px] items-center px-2 text-sm text-brand-dark/60">
              No credit activity yet.
            </div>
          )}

          {Array.from({ length: placeholderCount }).map((_, index) => (
            <div
              key={`credit-placeholder-${index}`}
              aria-hidden="true"
              className="h-[68px] border-t border-brand-dark/10"
            />
          ))}
        </dl>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-brand-dark/10 pt-4">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="rounded-none border border-brand-dark/20 px-4 py-2 text-sm font-medium text-brand-dark/70 transition-colors duration-300 hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Previous
        </button>
        <span className="text-sm text-brand-dark/60">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="rounded-none border border-brand-dark/20 px-4 py-2 text-sm font-medium text-brand-dark/70 transition-colors duration-300 hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Next
        </button>
      </div>
    </div>
  )
}
