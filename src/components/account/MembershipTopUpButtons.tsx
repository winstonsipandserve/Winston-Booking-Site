'use client'

import { useEffect, useState } from 'react'
import { formatCentavos } from '@/lib/format'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import { TOPUP_PRESETS_CENTAVOS } from '@/lib/membership-topup'

export default function MembershipTopUpButtons() {
  const [submittingAmount, setSubmittingAmount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl
    }
  }, [redirectUrl])

  async function handleClick(amountCentavos: number) {
    setSubmittingAmount(amountCentavos)
    setError(null)

    try {
      const res = await fetch('/api/account/membership-topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCentavos }),
      })

      if (res.ok) {
        const json: { checkoutUrl: string } = await res.json()
        setRedirectUrl(json.checkoutUrl)
        return
      }

      const json = await res.json().catch(() => null)
      setError(json?.error ?? 'Something went wrong. Please try again.')
      setSubmittingAmount(null)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmittingAmount(null)
    }
  }

  return (
    <div>
      <LoadingOverlay isOpen={submittingAmount !== null} label="Redirecting to payment…" />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        {TOPUP_PRESETS_CENTAVOS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handleClick(amount)}
            disabled={submittingAmount !== null}
            className="rounded-none border border-brand-dark/15 px-4 py-2.5 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {formatCentavos(amount)}
          </button>
        ))}
      </div>
    </div>
  )
}
