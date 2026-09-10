'use client'

import { useState } from 'react'
import PasswordInput from '@/components/ui/PasswordInput'
import ConfirmModal from '@/components/admin/ConfirmModal'

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
      <details className="group rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/40">
        <summary className="flex cursor-pointer list-none items-start gap-3 p-5 text-left marker:hidden [&::-webkit-details-marker]:hidden">
          <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true">
            <path d="M12 3 2.8 20h18.4L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M12 9v5M12 17.5v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-amber-900 dark:text-amber-200">Change Password</span>
            <span className="mt-1 block text-sm text-amber-800 dark:text-amber-300">Use this only if you need to update your admin sign-in password.</span>
          </span>
          <svg viewBox="0 0 24 24" fill="none" className="mt-1 h-4 w-4 shrink-0 text-amber-700 transition-transform group-open:rotate-180 dark:text-amber-400" aria-hidden="true">
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>

        <div className="border-t border-amber-200/80 px-5 pb-5 pt-4 dark:border-amber-900/50">
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
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Password changed successfully.</p>
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
