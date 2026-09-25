'use client'

import { useState } from 'react'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

interface CompletePaymentButtonProps {
  applicationId: string
  token: string
}

export default function CompletePaymentButton({ applicationId, token }: CompletePaymentButtonProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/membership-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, token }),
      })

      if (res.ok) {
        const json: { checkoutUrl: string } = await res.json()
        window.location.href = json.checkoutUrl
        return
      }

      const json = await res.json().catch(() => null)
      setError(json?.error ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <LoadingOverlay isOpen={submitting} label="Redirecting to payment…" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className="w-full rounded-md bg-gray-900 px-6 py-3 text-center text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Complete Payment
      </button>
    </div>
  )
}
