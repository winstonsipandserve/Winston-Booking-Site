'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { formatCentavos } from '@/lib/format'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 15

interface TopUpStatusResult {
  id: string
  status: string
  amountCentavos: number
  hasCompleted: boolean
  newBalanceCentavos: number | null
}

type FetchResult = TopUpStatusResult | 'not_found' | 'error'

const CHECK_AGAIN_BUTTON_CLASSES =
  'rounded-none bg-accent-primary px-5 py-3 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark disabled:opacity-50'

const BACK_ACCOUNT_LINK_CLASSES =
  'text-accent-primary underline underline-offset-2 hover:text-accent-dark'

export default function ConfirmationContent() {
  const searchParams = useSearchParams()
  const topUpPaymentId = searchParams.get('topUpPaymentId')

  const [payment, setPayment] = useState<TopUpStatusResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [stalled, setStalled] = useState(false)
  const [checkingAgain, setCheckingAgain] = useState(false)
  const pollCountRef = useRef(0)

  async function fetchPayment(id: string): Promise<FetchResult> {
    try {
      const res = await fetch(`/api/account/membership-topup/${encodeURIComponent(id)}`)
      if (res.status === 404) return 'not_found'
      if (!res.ok) return 'error'
      return (await res.json()) as TopUpStatusResult
    } catch {
      return 'error'
    }
  }

  useEffect(() => {
    if (!topUpPaymentId) return
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    async function poll() {
      const result = await fetchPayment(topUpPaymentId!)
      if (cancelled) return

      if (result === 'not_found') {
        setNotFound(true)
        return
      }

      if (result === 'error') {
        pollCountRef.current += 1
        if (pollCountRef.current >= MAX_POLLS) {
          setStalled(true)
          return
        }
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
        return
      }

      setPayment(result)

      if (result.hasCompleted) {
        return
      }

      pollCountRef.current += 1
      if (pollCountRef.current >= MAX_POLLS) {
        setStalled(true)
        return
      }
      timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [topUpPaymentId])

  async function handleCheckAgain() {
    if (!topUpPaymentId) return
    setCheckingAgain(true)
    const result = await fetchPayment(topUpPaymentId)
    setCheckingAgain(false)

    if (result === 'not_found') {
      setNotFound(true)
      return
    }
    if (result === 'error') {
      return
    }
    setPayment(result)
    if (result.hasCompleted) {
      setStalled(false)
    }
  }

  if (!topUpPaymentId) {
    return <p className="text-brand-dark/60">No top-up reference was provided.</p>
  }

  if (notFound) {
    return (
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <p className="text-red-600">
          We couldn&apos;t find that payment. If you completed a payment, please contact us.
        </p>
        <Link href="/account" className={BACK_ACCOUNT_LINK_CLASSES}>
          Back to My Account
        </Link>
      </div>
    )
  }

  if (!payment) {
    if (stalled) {
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <LoadingOverlay isOpen={checkingAgain} label="Checking…" />
          <p className="text-brand-dark/60">
            We&apos;re having trouble reaching the server. Please check again.
          </p>
          <button
            type="button"
            onClick={handleCheckAgain}
            disabled={checkingAgain}
            className={CHECK_AGAIN_BUTTON_CLASSES}
          >
            Check Again
          </button>
        </div>
      )
    }
    return <p className="text-brand-dark/60">Loading your top-up…</p>
  }

  if (payment.hasCompleted) {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="flex flex-col gap-1 text-center">
          <h2 className="font-serif text-2xl text-brand-dark">Your credit has been topped up!</h2>
        </div>

        <div className="rounded-card border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
          <dl className="flex flex-col">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-brand-dark/70">Amount Added</dt>
              <dd className="text-right font-medium text-brand-dark">
                {formatCentavos(payment.amountCentavos)}
              </dd>
            </div>
            {payment.newBalanceCentavos !== null && (
              <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                <dt className="text-brand-dark/70">New Credit Balance</dt>
                <dd className="text-right font-medium text-brand-dark">
                  {formatCentavos(payment.newBalanceCentavos)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <Link
          href="/account"
          className="rounded-none bg-accent-primary px-9 py-3.5 text-center text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark"
        >
          Go to My Account
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <LoadingOverlay isOpen={checkingAgain} label="Checking…" />
      <p className="text-brand-dark/60">
        {stalled
          ? 'This is taking longer than expected. You can check again, or contact us if this persists.'
          : 'Confirming your payment…'}
      </p>
      {stalled && (
        <button
          type="button"
          onClick={handleCheckAgain}
          disabled={checkingAgain}
          className={CHECK_AGAIN_BUTTON_CLASSES}
        >
          Check Again
        </button>
      )}
    </div>
  )
}
