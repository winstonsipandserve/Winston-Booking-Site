'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import PasswordInput from '@/components/ui/PasswordInput'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function AdminResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (!token) {
    return (
      <p className="mt-6 text-sm text-gray-600">
        This reset link is missing its token. Please use the full link from your password
        reset email.
      </p>
    )
  }

  if (submitState === 'success') {
    return (
      <div className="mt-6">
        <p className="text-sm text-gray-600">Your password has been reset.</p>
        <Link href="/admin/login" className="mt-2 inline-block text-sm font-medium text-gray-900 hover:underline">
          Go to Sign In
        </Link>
      </div>
    )
  }

  const submitting = submitState === 'submitting'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitState('submitting')
    setSubmitError(null)

    const formData = new FormData(e.target as HTMLFormElement)
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')

    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })

      if (res.status === 200) {
        setSubmitState('success')
      } else if (res.status === 400 || res.status === 404) {
        const json = await res.json().catch(() => null)
        setSubmitError(json?.error ?? 'There was a problem resetting your password.')
        setSubmitState('error')
      } else {
        setSubmitError('Something went wrong. Please try again.')
        setSubmitState('error')
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.')
      setSubmitState('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <PasswordInput id="password" name="password" label="New Password" required autoComplete="new-password" />
      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm New Password"
        required
        autoComplete="new-password"
      />

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Resetting…' : 'Reset Password'}
      </button>
    </form>
  )
}
