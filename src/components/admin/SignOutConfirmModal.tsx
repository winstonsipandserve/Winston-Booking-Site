'use client'

import { useTransition } from 'react'
import Modal from '@/components/ui/Modal'
import { adminSignOut } from '@/lib/actions/admin-auth-actions'

export default function SignOutConfirmModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await adminSignOut()
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign Out" variant="neutral">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        You&apos;ll need to sign in again to access the admin panel. Continue?
      </p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {isPending ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </Modal>
  )
}
