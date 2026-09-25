'use client'

import { useState } from 'react'
import Link from 'next/link'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')

  if (submitState === 'success') {
    return (
      <div className="flex w-full flex-col gap-4 text-center">
        <p className="text-gray-500">
          If that email is registered, you&apos;ll receive a reset link shortly.
        </p>
      </div>
    )
  }

  const submitting = submitState === 'submitting'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitState('submitting')

    try {
      const res = await fetch('/api/auth/forgot-password', {
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
    <div className="w-full">
      <LoadingOverlay isOpen={submitting} label="Sending…" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-gray-900">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={submitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none disabled:opacity-50"
          />
        </div>

        {submitState === 'error' && (
          <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors duration-300 hover:bg-gray-700 disabled:opacity-50"
        >
          Send Reset Link
        </button>

        <Link href="/login" className="text-center text-sm text-gray-500">
          Back to Sign In
        </Link>
      </form>
    </div>
  )
}
