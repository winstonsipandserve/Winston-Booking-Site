'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'

export default function MembershipReviewActions({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    if (!window.confirm('Approve this membership application? This will activate the membership immediately.')) {
      return
    }
    setIsApproving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/memberships/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        setError(json?.error ?? 'Something went wrong. Please try again.')
        setIsApproving(false)
        return
      }
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setIsApproving(false)
    }
  }

  return (
    <div>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isApproving}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => setIsRejectModalOpen(true)}
          disabled={isApproving}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reject
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <RejectModal
        applicationId={applicationId}
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
      />
    </div>
  )
}

function RejectModal({
  applicationId,
  isOpen,
  onClose,
}: {
  applicationId: string
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (reason.trim().length === 0) {
      setError('A rejection reason is required')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/memberships/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: reason.trim() }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        setError(json?.error ?? 'Something went wrong. Please try again.')
        setIsSubmitting(false)
        return
      }
      router.refresh()
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Membership Application">
      {isOpen && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-gray-900">
            Rejection reason
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
              placeholder="Explain why this application is being rejected"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </label>

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
