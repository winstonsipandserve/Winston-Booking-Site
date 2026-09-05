'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MembershipTier } from '@prisma/client'
import Modal from '@/components/ui/Modal'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { formatMembershipTier } from '@/lib/format'

const TIERS = Object.keys(MEMBERSHIP_TIER_PLANS) as MembershipTier[]

export default function SendRenewalLinkButton({ applicationId }: { applicationId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Send Renewal Link
      </button>

      <TierPickerModal
        applicationId={applicationId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

function TierPickerModal({
  applicationId,
  isOpen,
  onClose,
}: {
  applicationId: string
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [tier, setTier] = useState<MembershipTier>(TIERS[0])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  function handleClose() {
    setError(null)
    setConfirmation(null)
    setIsSubmitting(false)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/memberships/${applicationId}/send-renewal-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setError(json?.error ?? 'Something went wrong. Please try again.')
        setIsSubmitting(false)
        return
      }
      router.refresh()
      setConfirmation(
        json?.resent ? 'A renewal link was already pending — resent.' : 'Renewal link sent.',
      )
      setIsSubmitting(false)
    } catch {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Renewal Link" variant="neutral">
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
              Renewal tier
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as MembershipTier)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {formatMembershipTier(t)}
                  </option>
                ))}
              </select>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            </label>

            <div className="mt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Send Link
              </button>
            </div>
          </form>
        ))}
    </Modal>
  )
}
