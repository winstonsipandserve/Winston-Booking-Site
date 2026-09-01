'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BookingStatus } from '@prisma/client'
import Modal from '@/components/ui/Modal'

const STATUS_OPTIONS: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending_payment', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function BookingsFilterModal({
  status,
  startDate,
  endDate,
}: {
  status: BookingStatus | 'all'
  startDate: string
  endDate: string
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [draftStatus, setDraftStatus] = useState<BookingStatus | 'all'>(status)
  const [draftStartDate, setDraftStartDate] = useState(startDate)
  const [draftEndDate, setDraftEndDate] = useState(endDate)

  const isFilterActive = status !== 'all' || startDate !== '' || endDate !== ''

  function openModal() {
    setDraftStatus(status)
    setDraftStartDate(startDate)
    setDraftEndDate(endDate)
    setIsOpen(true)
  }

  function handleRun() {
    const params = new URLSearchParams()
    if (draftStatus !== 'all') params.set('status', draftStatus)
    if (draftStartDate) params.set('startDate', draftStartDate)
    if (draftEndDate) params.set('endDate', draftEndDate)
    const query = params.toString()
    router.push(`/admin/bookings${query ? `?${query}` : ''}`)
    setIsOpen(false)
  }

  function handleClear() {
    router.push('/admin/bookings')
    setIsOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        Filter
        {isFilterActive && <span className="h-1.5 w-1.5 rounded-full bg-gray-900" aria-hidden="true" />}
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Filter Bookings" variant="neutral">
        <div className="flex flex-col gap-4">
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Status
            </span>
            <div className="flex flex-col gap-1.5">
              {STATUS_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm text-gray-900">
                  <input
                    type="radio"
                    name="booking-status"
                    value={option.value}
                    checked={draftStatus === option.value}
                    onChange={() => setDraftStatus(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Date range
            </span>
            <div className="flex items-center gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs text-gray-600">
                From
                <input
                  type="date"
                  value={draftStartDate}
                  onChange={(e) => setDraftStartDate(e.target.value)}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs text-gray-600">
                To
                <input
                  type="date"
                  value={draftEndDate}
                  onChange={(e) => setDraftEndDate(e.target.value)}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900"
                />
              </label>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleRun}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Run
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
