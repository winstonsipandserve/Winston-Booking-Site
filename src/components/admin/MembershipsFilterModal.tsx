'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import type { MembershipDisplayStatus } from '@/lib/membership-display-status'

const STATUS_OPTIONS: { value: MembershipDisplayStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'rejected', label: 'Rejected' },
]

export default function MembershipsFilterModal({ status }: { status: MembershipDisplayStatus | 'all' }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [draftStatus, setDraftStatus] = useState<MembershipDisplayStatus | 'all'>(status)

  const isFilterActive = status !== 'all'

  function openModal() {
    setDraftStatus(status)
    setIsOpen(true)
  }

  function handleRun() {
    router.push(`/admin/memberships${draftStatus !== 'all' ? `?status=${draftStatus}` : ''}`)
    setIsOpen(false)
  }

  function handleClear() {
    router.push('/admin/memberships')
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

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Filter Memberships" variant="neutral">
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
                    name="membership-status"
                    value={option.value}
                    checked={draftStatus === option.value}
                    onChange={() => setDraftStatus(option.value)}
                  />
                  {option.label}
                </label>
              ))}
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
