'use client'

import { useState, useTransition } from 'react'
import Modal from '@/components/ui/Modal'
import { SignOutIcon } from '@/components/admin/AdminIcons'
import { adminSignOut } from '@/lib/actions/admin-auth-actions'

export default function SignOutButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await adminSignOut()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        <SignOutIcon className="h-4 w-4" />
        Sign Out
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Sign Out">
        <p className="text-sm text-gray-600">
          You&apos;ll need to sign in again to access the admin panel. Continue?
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </Modal>
    </>
  )
}
