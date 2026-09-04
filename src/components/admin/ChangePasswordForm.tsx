'use client'

import { useState } from 'react'
import PasswordInput from '@/components/ui/PasswordInput'
import ConfirmModal from '@/components/admin/ConfirmModal'

interface ChangePasswordFormProps {
  name: string
  email: string
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function ChangePasswordForm({ name, email }: ChangePasswordFormProps) {
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
    <div className="max-w-md">
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Profile</h2>
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">Name</span>
          <span className="text-gray-900">{name}</span>
        </div>
        <div className="mt-3 flex flex-col gap-1 text-sm">
          <span className="text-gray-500">Email</span>
          <span className="text-gray-900">{email}</span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Change Password</h2>
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
            <p className="text-sm font-medium text-gray-900">Password changed successfully.</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 self-start rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        onConfirm={() => setErrorModalOpen(false)}
        hideCancel
        confirmLabel="OK"
        title="Unable to Change Password"
        message={submitError ?? 'There was a problem changing your password.'}
      />
    </div>
  )
}
