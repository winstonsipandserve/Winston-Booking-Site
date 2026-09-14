'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'

export default function ResendPaymentLinkButton({
  applicationId,
  email,
}: {
  applicationId: string
  email: string
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Resend Payment Link
      </button>

      <ResendPaymentLinkModal
        applicationId={applicationId}
        email={email}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

function ResendPaymentLinkModal({
  applicationId,
  email,
  isOpen,
  onClose,
}: {
  applicationId: string
  email: string
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  function handleClose() {
    setError(null)
    setConfirmation(null)
    setIsSubmitting(false)
    onClose()
  }

  async function handleConfirm() {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/memberships/${applicationId}/resend-payment-link`, {
        method: 'POST',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setError(json?.error ?? 'Something went wrong. Please try again.')
        setIsSubmitting(false)
        return
      }
      router.refresh()
      setConfirmation('Payment link sent.')
      setIsSubmitting(false)
    } catch {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Resend Payment Link" variant="neutral">
      {isOpen &&
        (confirmation ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-900 dark:text-gray-100">{confirmation}</p>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-900 dark:text-gray-100">
              Send a new payment link to <span className="font-medium">{email}</span>? Any
              earlier unused link will stop working.
            </p>
            {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
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
                disabled={isSubmitting}
                className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {isSubmitting ? 'Sending…' : 'Resend Payment Link'}
              </button>
            </div>
          </div>
        ))}
    </Modal>
  )
}
