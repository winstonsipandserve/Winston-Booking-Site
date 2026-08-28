'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import MembershipPaymentConfirmation from '@/components/membership/MembershipPaymentConfirmation'

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 15

interface ApplicationStatusResult {
  id: string
  status: string
  tierName: string
  hasMembership: boolean
}

type FetchResult = ApplicationStatusResult | 'not_found' | 'error'

const CHECK_AGAIN_BUTTON_CLASSES =
  'rounded-full bg-accent-primary px-5 py-3 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark disabled:opacity-50'

const BACK_HOME_LINK_CLASSES =
  'text-accent-primary underline underline-offset-2 hover:text-accent-dark'

export default function ConfirmationContent() {
  const searchParams = useSearchParams()
  const applicationId = searchParams.get('applicationId')

  const [application, setApplication] = useState<ApplicationStatusResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [stalled, setStalled] = useState(false)
  const [checkingAgain, setCheckingAgain] = useState(false)
  const pollCountRef = useRef(0)

  async function fetchApplication(id: string): Promise<FetchResult> {
    try {
      const res = await fetch(`/api/membership-applications/${encodeURIComponent(id)}`)
      if (res.status === 404) return 'not_found'
      if (!res.ok) return 'error'
      return (await res.json()) as ApplicationStatusResult
    } catch {
      return 'error'
    }
  }

  useEffect(() => {
    if (!applicationId) return
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    async function poll() {
      const result = await fetchApplication(applicationId!)
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

      setApplication(result)

      if (result.hasMembership || result.status === 'rejected') {
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
  }, [applicationId])

  async function handleCheckAgain() {
    if (!applicationId) return
    setCheckingAgain(true)
    const result = await fetchApplication(applicationId)
    setCheckingAgain(false)

    if (result === 'not_found') {
      setNotFound(true)
      return
    }
    if (result === 'error') {
      return
    }
    setApplication(result)
    if (result.hasMembership || result.status === 'rejected') {
      setStalled(false)
    }
  }

  if (!applicationId) {
    return <p className="text-brand-dark/60">No application reference was provided.</p>
  }

  if (notFound) {
    return (
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <p className="text-red-600">
          We couldn&apos;t find that application. If you completed a payment, please contact us.
        </p>
        <Link href="/" className={BACK_HOME_LINK_CLASSES}>
          Back to Home
        </Link>
      </div>
    )
  }

  if (!application) {
    if (stalled) {
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-brand-dark/60">
            We&apos;re having trouble reaching the server. Please check again.
          </p>
          <button
            type="button"
            onClick={handleCheckAgain}
            disabled={checkingAgain}
            className={CHECK_AGAIN_BUTTON_CLASSES}
          >
            {checkingAgain ? 'Checking…' : 'Check Again'}
          </button>
        </div>
      )
    }
    return <p className="text-brand-dark/60">Loading your application…</p>
  }

  if (application.status === 'rejected') {
    return (
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <p className="text-red-600">
          This application isn&apos;t approved. If you completed a payment, please contact us and
          reference this application id:
        </p>
        <p className="font-mono text-sm text-brand-dark">{application.id}</p>
        <Link href="/" className={BACK_HOME_LINK_CLASSES}>
          Back to Home
        </Link>
      </div>
    )
  }

  if (application.hasMembership) {
    return <MembershipPaymentConfirmation tierName={application.tierName} />
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
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
          {checkingAgain ? 'Checking…' : 'Check Again'}
        </button>
      )}
    </div>
  )
}
