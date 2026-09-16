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
        <p className="text-brand-dark/70">
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
          <label htmlFor="email" className="text-sm font-medium text-brand-dark">
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
            className="rounded-input border border-brand-dark/20 bg-brand-light px-3 py-2 text-brand-dark placeholder:text-brand-dark/40 focus:border-accent-primary focus:outline-none disabled:opacity-50"
          />
        </div>

        {submitState === 'error' && (
          <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-none bg-accent-primary px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light disabled:opacity-50"
        >
          Send Reset Link
        </button>

        <Link href="/login" className="text-center text-sm text-brand-dark/50">
          Back to Sign In
        </Link>
      </form>
    </div>
  )
}
