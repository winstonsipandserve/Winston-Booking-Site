'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import BookingConfirmation, { type BookingDetail } from '@/components/booking/BookingConfirmation'

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 15

type FetchResult = BookingDetail | 'not_found' | 'error'

export default function ConfirmationContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [stalled, setStalled] = useState(false)
  const [checkingAgain, setCheckingAgain] = useState(false)
  const pollCountRef = useRef(0)

  async function fetchBooking(id: string): Promise<FetchResult> {
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`)
      if (res.status === 404) return 'not_found'
      if (!res.ok) return 'error'
      return (await res.json()) as BookingDetail
    } catch {
      return 'error'
    }
  }

  useEffect(() => {
    if (!bookingId) return
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    async function poll() {
      const result = await fetchBooking(bookingId!)
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

      setBooking(result)

      if (result.status !== 'pending_payment') {
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
  }, [bookingId])

  async function handleCheckAgain() {
    if (!bookingId) return
    setCheckingAgain(true)
    const result = await fetchBooking(bookingId)
    setCheckingAgain(false)

    if (result === 'not_found') {
      setNotFound(true)
      return
    }
    if (result === 'error') {
      return
    }
    setBooking(result)
    if (result.status !== 'pending_payment') {
      setStalled(false)
    }
  }

  if (!bookingId) {
    return <p className="text-zinc-600 dark:text-zinc-400">No booking reference was provided.</p>
  }

  if (notFound) {
    return (
      <p className="max-w-md text-center text-red-600">
        We couldn&apos;t find that booking. If you completed a payment, please contact us with
        your booking reference.
      </p>
    )
  }

  if (!booking) {
    if (stalled) {
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            We&apos;re having trouble reaching the server. Please check again.
          </p>
          <button
            type="button"
            onClick={handleCheckAgain}
            disabled={checkingAgain}
            className="rounded-full bg-foreground px-5 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {checkingAgain ? 'Checking…' : 'Check Again'}
          </button>
        </div>
      )
    }
    return <p className="text-zinc-600 dark:text-zinc-400">Loading your booking…</p>
  }

  if (booking.status === 'cancelled') {
    return (
      <div className="flex max-w-md flex-col items-center gap-2 text-center">
        <p className="text-red-600">
          This booking couldn&apos;t be confirmed. If you completed a payment, please contact us
          and reference this booking id:
        </p>
        <p className="font-mono text-sm">{booking.id}</p>
      </div>
    )
  }

  if (booking.status === 'confirmed') {
    return <BookingConfirmation booking={booking} />
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-zinc-600 dark:text-zinc-400">
        {stalled
          ? 'This is taking longer than expected. You can check again, or contact us if this persists.'
          : 'Confirming your payment…'}
      </p>
      {stalled && (
        <button
          type="button"
          onClick={handleCheckAgain}
          disabled={checkingAgain}
          className="rounded-full bg-foreground px-5 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {checkingAgain ? 'Checking…' : 'Check Again'}
        </button>
      )}
    </div>
  )
}
