'use client'

import { useState } from 'react'
import type { MembershipTier } from '@prisma/client'
import { formatMembershipTier } from '@/lib/format'

interface RenewMembershipButtonProps {
  tier: MembershipTier
}

export default function RenewMembershipButton({ tier }: RenewMembershipButtonProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/account/membership-renewal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className="w-full rounded-full bg-accent-primary px-9 py-3.5 text-center text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {submitting ? 'Redirecting to payment…' : `Renew — ${formatMembershipTier(tier)}`}
      </button>
    </div>
  )
}
