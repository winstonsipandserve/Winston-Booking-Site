'use client'

import { useEffect, useRef, useState } from 'react'
import CheckInResultCard, { type CheckInResult } from '@/components/admin/CheckInResultCard'

export default function CheckInCodeEntry() {
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<CheckInResult | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const isValidCode = /^\d{6}$/.test(code)

  // Focus the field whenever the form is (re)shown so the desk can type straight away.
  useEffect(() => {
    if (!result) inputRef.current?.focus()
  }, [result])

  async function verifyCode(value: string) {
    if (!/^\d{6}$/.test(value) || isVerifying) return

    setIsVerifying(true)
    try {
      const res = await fetch(`/api/admin/check-in/code/${encodeURIComponent(value)}`)
      const json = await res.json().catch(() => null)

      if (res.status === 429) {
        const retryAfterSeconds = json?.retryAfterSeconds
        const minutes = typeof retryAfterSeconds === 'number' ? Math.ceil(retryAfterSeconds / 60) : null
        const message =
          minutes && minutes > 0
            ? `Too many attempts. Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`
            : 'Too many attempts. Please wait before trying again.'
        setResult({ status: 'rate_limited', message })
      } else if (res.status === 404) {
        setResult({ status: 'not_found' })
      } else if (res.ok && json?.hasMembership === false) {
        setResult({ status: 'no_membership', name: json.name })
      } else if (res.ok && json?.hasMembership === true) {
        setResult({
          status: json.isExpired ? 'expired' : 'active',
          name: json.name,
          email: json.email,
          tierName: json.tierName,
          expiryDateLabel: json.expiryDateLabel,
          remainingCreditCentavos: json.remainingCreditCentavos,
        })
      } else {
        setResult({ status: 'not_found' })
      }
    } catch (err) {
      console.error('Failed to verify entered code', err)
      setResult({ status: 'not_found' })
    } finally {
      setIsVerifying(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void verifyCode(code)
  }

  // Six digits is a complete code — submit without waiting for the button.
  function handleChange(next: string) {
    const digits = next.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    if (digits.length === 6) void verifyCode(digits)
  }

  function handleEnterAnother() {
    setResult(null)
    setCode('')
  }

  if (result) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
        <CheckInResultCard result={result} actionLabel="Enter Another Code" onAction={handleEnterAnother} />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col items-center gap-4">
      <label htmlFor="check-in-code" className="sr-only">
        6-digit check-in code
      </label>
      <input
        ref={inputRef}
        id="check-in-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="000000"
        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-center text-2xl font-semibold tracking-[0.3em] text-gray-900 focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-500"
      />
      {code.length > 0 && !isValidCode && (
        <p className="text-xs text-red-600 dark:text-red-400">Enter exactly 6 digits.</p>
      )}
      <button
        type="submit"
        disabled={!isValidCode || isVerifying}
        className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
      >
        {isVerifying ? 'Verifying…' : 'Check In'}
      </button>
    </form>
  )
}
