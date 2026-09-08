'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { parseCentavos } from '@/lib/format'

type TopUpMode = 'cash' | 'manual_online'

const MODE_BUTTON_BASE_CLASSES = 'flex-1 rounded-lg border px-3 py-2 text-sm font-medium'
const MODE_BUTTON_ACTIVE_CLASSES =
  'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
const MODE_BUTTON_INACTIVE_CLASSES =
  'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'

export default function AddCreditButton({ membershipId }: { membershipId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Add Credit
      </button>

      <AddCreditModal
        membershipId={membershipId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

function AddCreditModal({
  membershipId,
  isOpen,
  onClose,
}: {
  membershipId: string
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [mode, setMode] = useState<TopUpMode>('cash')
  const [amountInput, setAmountInput] = useState('')
  const [note, setNote] = useState('')
  const [externalReference, setExternalReference] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleClose() {
    setError(null)
    setIsSubmitting(false)
    setAmountInput('')
    setNote('')
    setExternalReference('')
    setMode('cash')
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const amountCentavos = parseCentavos(amountInput)
    if (amountCentavos === null || amountCentavos < 10000) {
      setError('Enter an amount of at least ₱100')
      return
    }
    if (mode === 'cash' && note.trim().length === 0) {
      setError('A note is required for cash top-ups')
      return
    }
    if (mode === 'manual_online' && externalReference.trim().length === 0) {
      setError('A reference is required for online top-ups')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/memberships/${membershipId}/credit-topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          amountCentavos,
          note: note.trim() || undefined,
          externalReference: externalReference.trim() || undefined,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setError(json?.error ?? 'Something went wrong. Please try again.')
        setIsSubmitting(false)
        return
      }
      router.refresh()
      handleClose()
    } catch {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Credit" variant="neutral">
      {isOpen && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('cash')}
              className={`${MODE_BUTTON_BASE_CLASSES} ${mode === 'cash' ? MODE_BUTTON_ACTIVE_CLASSES : MODE_BUTTON_INACTIVE_CLASSES}`}
            >
              Cash
            </button>
            <button
              type="button"
              onClick={() => setMode('manual_online')}
              className={`${MODE_BUTTON_BASE_CLASSES} ${mode === 'manual_online' ? MODE_BUTTON_ACTIVE_CLASSES : MODE_BUTTON_INACTIVE_CLASSES}`}
            >
              Online
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
            Amount (₱)
            <input
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="e.g. 1000"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>

          {mode === 'cash' ? (
            <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
              Note
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="e.g. Received at front desk"
              />
            </label>
          ) : (
            <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
              Reference
              <input
                type="text"
                value={externalReference}
                onChange={(e) => setExternalReference(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="e.g. GCash ref #12345"
              />
            </label>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

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
              {isSubmitting ? 'Adding…' : 'Add Credit'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
