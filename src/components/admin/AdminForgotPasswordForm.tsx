'use client'

import { useState } from 'react'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function AdminForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')

  if (submitState === 'success') {
    return (
      <p className="mt-6 text-sm text-gray-600">
        If that email is registered, you&apos;ll receive a reset link shortly.
      </p>
    )
  }

  const submitting = submitState === 'submitting'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitState('submitting')

    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.status === 200) {
        setSubmitState('success')
      } else {
        setSubmitState('error')
      }
    } catch {
      setSubmitState('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <label htmlFor="email" className="flex flex-col gap-1 text-sm text-gray-900">
        Email
        <input
          id="email"
          name="email"
          type="email"
          required
          disabled={submitting}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
        />
      </label>

      {submitState === 'error' && (
        <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Send Reset Link'}
      </button>
    </form>
  )
}
