'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'
type CheckState = 'checking' | 'valid' | 'invalid'

function inputClassName() {
  return 'rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none disabled:opacity-50'
}

export default function ActivateForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [checkState, setCheckState] = useState<CheckState>('checking')
  const [checkError, setCheckError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    let cancelled = false

    fetch(`/api/activate?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (cancelled) return
        if (res.ok) {
          setCheckState('valid')
          return
        }
        const json = await res.json().catch(() => null)
        setCheckError(json?.error ?? 'This activation link is no longer valid.')
        setCheckState('invalid')
      })
      .catch(() => {
        if (cancelled) return
        setCheckError('This activation link is no longer valid.')
        setCheckState('invalid')
      })

    return () => {
      cancelled = true
    }
  }, [token])

  if (!token) {
    return (
      <div className="flex w-full flex-col gap-4 text-center">
        <p className="text-gray-500">
          This activation link is missing its token. Please use the full link from your
          activation email.
        </p>
      </div>
    )
  }

  if (checkState === 'checking') {
    return (
      <div className="flex w-full flex-col gap-4 text-center">
        <p className="text-gray-500">Checking your activation link…</p>
      </div>
    )
  }

  if (checkState === 'invalid') {
    return (
      <div className="flex w-full flex-col gap-4 text-center">
        <p className="text-gray-500">{checkError}</p>
        <p className="text-sm text-gray-500">
          Please contact the club to request a new activation link.
        </p>
      </div>
    )
  }

  if (submitState === 'success') {
    return (
      <div className="flex w-full flex-col gap-4 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Your account is activated</h2>
        <p className="text-sm text-gray-500">
          You can now sign in.{' '}
          <Link href="/login" className="font-medium text-gray-900 hover:text-gray-700">
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
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
      <LoadingOverlay isOpen={submitting} label="Activating…" />
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-gray-900">
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
        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">
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
        className="w-full rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
      >
        Set Password
      </button>
    </form>
  )
}
