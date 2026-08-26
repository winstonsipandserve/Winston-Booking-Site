'use client'

import { useState } from 'react'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')

  if (submitState === 'success') {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 text-center shadow-xl shadow-brand-dark/10">
        <p className="text-brand-dark/80">
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
    <div className="mx-auto flex w-full max-w-md flex-col rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            className="rounded-lg border border-brand-dark/20 bg-brand-light px-3 py-2 text-brand-dark placeholder:text-brand-dark/40 focus:border-accent-primary focus:outline-none disabled:opacity-50"
          />
        </div>

        {submitState === 'error' && (
          <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-accent-primary px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  )
}
