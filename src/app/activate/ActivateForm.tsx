'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

function inputClassName() {
  return 'rounded-lg border border-brand-dark/20 bg-brand-light px-3 py-2 text-brand-dark placeholder:text-brand-dark/40 focus:border-accent-primary focus:outline-none disabled:opacity-50'
}

export default function ActivateForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (!token) {
    return (
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-6 text-center shadow-xl shadow-brand-dark/10">
        <p className="text-brand-dark/70">
          This activation link is missing its token. Please use the full link from your
          activation email.
        </p>
      </div>
    )
  }

  if (submitState === 'success') {
    return (
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-6 text-center shadow-xl shadow-brand-dark/10">
        <h2 className="font-serif text-2xl text-brand-dark">Your account is activated</h2>
        <p className="text-sm text-brand-dark/70">
          You can now sign in.{' '}
          <Link href="/login" className="font-medium text-accent-primary hover:text-brand-dark">
            Go to Sign In
          </Link>
        </p>
      </div>
    )
  }

  const submitting = submitState === 'submitting'
  const isValid = password.length > 0 && confirmPassword.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setSubmitState('submitting')
    setSubmitError(null)

    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })

      if (res.status === 200) {
        setSubmitState('success')
      } else if (res.status === 400 || res.status === 404) {
        const json = await res.json().catch(() => null)
        setSubmitError(json?.error ?? 'There was a problem activating your account.')
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
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-6 shadow-xl shadow-brand-dark/10"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-brand-dark">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          disabled={submitting}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClassName()}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-brand-dark">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          disabled={submitting}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClassName()}
        />
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={!isValid || submitting}
        className="w-full rounded-none bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light disabled:opacity-50"
      >
        {submitting ? 'Activating…' : 'Set Password'}
      </button>
    </form>
  )
}
