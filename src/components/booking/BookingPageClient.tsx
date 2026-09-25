'use client'

import { useEffect, useState } from 'react'
import AnnouncementGate, { type GateNotice } from '@/components/booking/AnnouncementGate'
import BookingForm, { type ResourcesResponse } from '@/components/booking/BookingForm'

export interface MembershipCoverage {
  startsAt: string
  endsAt: string
  /** Manila `YYYY-MM-DD` of the term's first and last day — compared against the calendar's date keys. */
  startDateKey: string
  expiryDateKey: string
  expiryDateLabel: string
  creditBalanceCentavos: number
  /** Plan name for this term, e.g. "Winston Premier". */
  tierName: string
  /** Tier discount off the base court/simulator rate for slots this term covers. */
  bookingDiscountPercent: number
  /** How many days ahead (today + N, Manila) this term lets the member book. */
  advanceBookingDays: number
  /** Complimentary guest passes still unused in this term (docs/business.md → Guest passes). */
  guestPassesRemaining: number
  guestPassAllowance: number
  /** Birthday-month court hour for this term: the member's birthday month (1–12, null when
   *  no date of birth is on file), what it does for the tier, and whether it is already used. */
  birthdayPerk: { month: number | null; kind: 'half' | 'free'; used: boolean }
}

export interface MemberContext {
  name: string
  email: string
  phone: string
  isActiveMember: boolean
  creditBalanceCentavos: number
  /** Unexpired terms, earliest first. Empty for a lapsed member. */
  coverage: MembershipCoverage[]
}

interface BookingPageClientProps {
  memberContext: MemberContext | null
  notices: GateNotice[]
}

export default function BookingPageClient({ memberContext, notices }: BookingPageClientProps) {
  const [started, setStarted] = useState(false)
  const [data, setData] = useState<ResourcesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/resources', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load resources')
        return res.json() as Promise<ResourcesResponse>
      })
      .then((json) => {
        setData(json)
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setLoadError('Could not load resources. Please refresh the page.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-gray-50 px-6 py-10">
      {started ? (
        <BookingForm data={data} loading={loading} loadError={loadError} memberContext={memberContext} />
      ) : (
        <AnnouncementGate notices={notices} onContinue={() => setStarted(true)} />
      )}
    </div>
  )
}
