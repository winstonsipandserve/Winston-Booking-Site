'use client'

import { useState } from 'react'
import PasswordInput from '@/components/ui/PasswordInput'
import ConfirmModal from '@/components/admin/ConfirmModal'
import { ChevronDownIcon, LockIcon } from '@/components/admin/AdminIcons'
import { adminSignOut } from '@/lib/actions/admin-auth-actions'

// Changing the password revokes every session issued before it — including this one — so
// the admin is signed out shortly after the success message (docs/architecture.md → Authentication).
const SIGN_OUT_DELAY_MS = 2500

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function ChangePasswordForm() {
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const submitting = submitState === 'submitting'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitState('submitting')
    setSubmitError(null)

    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get('currentPassword')
    const newPassword = formData.get('newPassword')
    const confirmNewPassword = formData.get('confirmNewPassword')

    try {
      const res = await fetch('/api/admin/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      })

      if (res.status === 200) {
        setSubmitState('success')
        setFormKey((k) => k + 1)
        setTimeout(() => {
          void adminSignOut()
        }, SIGN_OUT_DELAY_MS)
      } else if (res.status === 400) {
        const json = await res.json().catch(() => null)
        setSubmitError(json?.error ?? 'There was a problem changing your password.')
        setErrorModalOpen(true)
        setSubmitState('error')
      } else {
        setSubmitError('Something went wrong. Please try again.')
        setErrorModalOpen(true)
        setSubmitState('error')
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.')
      setErrorModalOpen(true)
      setSubmitState('error')
    }
  }

  return (
    <>
      <details className="group rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <summary className="flex cursor-pointer list-none items-start gap-3 p-5 text-left marker:hidden [&::-webkit-details-marker]:hidden">
          <LockIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-gray-900 dark:text-gray-100">Change Password</span>
            <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">Update the password you use to sign in to the admin panel.</span>
          </span>
          <ChevronDownIcon className="mt-1 h-4 w-4 shrink-0 text-gray-500 transition-transform group-open:rotate-180 dark:text-gray-400" />
        </summary>

        <div className="border-t border-gray-100 px-5 pb-5 pt-4 dark:border-gray-800">
          <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            label="Current Password"
            required
            autoComplete="current-password"
          />
          <PasswordInput
            id="newPassword"
            name="newPassword"
            label="New Password"
            required
            autoComplete="new-password"
          />
          <PasswordInput
            id="confirmNewPassword"
            name="confirmNewPassword"
            label="Confirm New Password"
            required
            autoComplete="new-password"
          />

          {submitState === 'success' && (
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Password changed successfully. Signing you out — please sign in again with your new password.</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 self-start rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Change Password'}
          </button>
          </form>
        </div>
      </details>

      <ConfirmModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        onConfirm={() => setErrorModalOpen(false)}
        hideCancel
        confirmLabel="OK"
        title="Unable to Change Password"
        message={submitError ?? 'There was a problem changing your password.'}
      />
    </>
  )
}
