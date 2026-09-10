'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'

export default function MembershipReviewActions({
  applicationId,
  applicantName,
}: {
  applicationId: string
  applicantName: string
}) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function doApprove() {
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
      <div className="sticky bottom-0 z-20 -mx-6 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        {error && <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Review this application</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsApproveModalOpen(true)}
            disabled={isApproving}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-green-700 dark:hover:bg-green-600"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => setIsRejectModalOpen(true)}
            disabled={isApproving}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Reject
          </button>
        </div>
      </div>

      <ApproveModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        applicantName={applicantName}
        isSubmitting={isApproving}
        onConfirm={() => {
          setIsApproveModalOpen(false)
          void doApprove()
        }}
      />

      <RejectModal
        applicationId={applicationId}
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
      />
    </div>
  )
}

function ApproveModal({
  applicantName,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  applicantName: string
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const [confirmation, setConfirmation] = useState('')
  const expectedConfirmation = `${applicantName.trim()} approve`
  const normalizedConfirmation = confirmation.trim().replace(/\s+/g, ' ').toLowerCase()
  const normalizedExpectedConfirmation = expectedConfirmation.replace(/\s+/g, ' ').toLowerCase()
  const canConfirm = normalizedConfirmation === normalizedExpectedConfirmation

  function handleClose() {
    if (isSubmitting) return
    setConfirmation('')
    onClose()
  }

  function handleConfirm() {
    if (!canConfirm || isSubmitting) return
    onConfirm()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Approve Application?" variant="neutral">
      {isOpen && (
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
            The applicant will be emailed a payment link. Membership activates once payment is confirmed.
          </p>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="approval-confirmation" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Type <span className="font-semibold">{expectedConfirmation}</span> to confirm
            </label>
            <input
              id="approval-confirmation"
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              required
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-700"
              placeholder={expectedConfirmation}
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm || isSubmitting}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {isSubmitting ? 'Working…' : 'Approve'}
            </button>
          </div>
        </div>
      )}
    </Modal>
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

  const hasReason = reason.trim().length > 0

  function handleClose() {
    if (isSubmitting) return
    setReason('')
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reject Membership Application" variant="neutral">
      {isOpen && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="rejection-reason" className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
            Rejection reason
            <textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="Explain why this application is being rejected"
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
          </label>

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasReason || isSubmitting}
              className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-700 dark:hover:bg-red-600"
            >
              Reject
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
