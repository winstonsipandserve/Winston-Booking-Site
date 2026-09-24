'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import StepIndicator from './steps/StepIndicator'
import SportStep from './steps/SportStep'
import CourtStep from './steps/CourtStep'
import DateTimeStep from './steps/DateTimeStep'
import AddOnsStep from './steps/AddOnsStep'
import ReviewStep from './steps/ReviewStep'
import PaymentStep from './steps/PaymentStep'
import Modal from '@/components/ui/Modal'
import { formatCentavos } from '@/lib/format'
import {
  MAX_COURT_DURATION_MINUTES,
  NON_MEMBER_ADVANCE_BOOKING_DAYS,
  maxGuestsForRateTier,
} from '@/lib/booking-limits'
import { tierDiscountCentavos } from '@/lib/membership-pricing'
import { toPhDateString } from '@/lib/business-hours'
import type { MemberContext, MembershipCoverage } from '@/components/booking/BookingPageClient'

type RateTier = 'member' | 'non_member'
type ResourceCategory = 'court' | 'simulator'

interface PricingTier {
  durationMinutes: number
  priceCentavos: number
}

interface AddOnPricingTier {
  service: string
  rateTier: RateTier
  paxCount: number | null
  priceCentavos: number
}

interface ResourceOption {
  id: string
  label: string
}

interface ResourceTypeOption {
  id: string
  slug: string
  name: string
  category: ResourceCategory
  resources: ResourceOption[]
  pricing: PricingTier[]
  addOnPricing: AddOnPricingTier[]
}

interface CoachingPricing {
  available: boolean
  mode: 'flat' | 'paxTiered' | null
  flatPriceCentavos: number | null
  pax1PriceCentavos: number | null
  pax2PriceCentavos: number | null
}

const EMPTY_COACHING_PRICING: CoachingPricing = {
  available: false,
  mode: null,
  flatPriceCentavos: null,
  pax1PriceCentavos: null,
  pax2PriceCentavos: null,
}

function getCoachingPricing(
  resourceType: ResourceTypeOption | null,
  rateTier: RateTier,
): CoachingPricing {
  if (!resourceType) return EMPTY_COACHING_PRICING
  const rules = resourceType.addOnPricing.filter(
    (a) => a.service === 'coaching_fee' && a.rateTier === rateTier,
  )
  if (rules.length === 0) return EMPTY_COACHING_PRICING
  const flatRule = rules.find((r) => r.paxCount === null)
  if (flatRule) {
    return {
      available: true,
      mode: 'flat',
      flatPriceCentavos: flatRule.priceCentavos,
      pax1PriceCentavos: null,
      pax2PriceCentavos: null,
    }
  }
  return {
    available: true,
    mode: 'paxTiered',
    flatPriceCentavos: null,
    pax1PriceCentavos: rules.find((r) => r.paxCount === 1)?.priceCentavos ?? null,
    pax2PriceCentavos: rules.find((r) => r.paxCount === 2)?.priceCentavos ?? null,
  }
}

export interface ResourcesResponse {
  resourceTypes: ResourceTypeOption[]
  guestFeeCentavos: number
}

interface BusyRange {
  start: string
  end: string
}

// Whole hours up to the server-enforced cap (src/lib/booking-limits.ts).
const COURT_DURATIONS_MINUTES = Array.from(
  { length: MAX_COURT_DURATION_MINUTES / 60 },
  (_, i) => (i + 1) * 60,
)
const TOTAL_STEPS = 5

function getDurationOptions(resourceType: ResourceTypeOption): number[] {
  if (resourceType.category === 'court') return COURT_DURATIONS_MINUTES
  return Array.from(new Set(resourceType.pricing.map((p) => p.durationMinutes))).sort((a, b) => a - b)
}

/** Whole Manila calendar days from `fromKey` to `toKey` (both `YYYY-MM-DD`). */
function calendarDaysBetweenKeys(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number)
  const [ty, tm, td] = toKey.split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000)
}

/** The term covering a calendar date, by Manila date keys. */
function findTermForDate(memberContext: MemberContext | null, dateKey: string): MembershipCoverage | null {
  if (!memberContext) return null
  return (
    memberContext.coverage.find((term) => term.startDateKey <= dateKey && dateKey <= term.expiryDateKey) ??
    null
  )
}

/**
 * The term that covers the slot being built. Falls back to date-level matching before a
 * time is picked, and to the term covering now before a date is picked.
 */
function findCoveringMembership(
  memberContext: MemberContext | null,
  selectedDate: string | null,
  startTimeLocal: string,
): MembershipCoverage | null {
  if (!memberContext) return null
  if (startTimeLocal) {
    const slotStart = new Date(startTimeLocal)
    return (
      memberContext.coverage.find(
        (term) => new Date(term.startsAt) <= slotStart && slotStart <= new Date(term.endsAt),
      ) ?? null
    )
  }
  if (selectedDate) {
    return (
      memberContext.coverage.find(
        (term) => term.startDateKey <= selectedDate && selectedDate <= term.expiryDateKey,
      ) ?? null
    )
  }
  if (!memberContext.isActiveMember) return null
  const now = new Date()
  return (
    memberContext.coverage.find((term) => new Date(term.startsAt) <= now && now <= new Date(term.endsAt)) ??
    null
  )
}

interface BookingFormProps {
  data: ResourcesResponse | null
  loading: boolean
  loadError: string | null
  memberContext: MemberContext | null
}

export default function BookingForm({ data, loading, loadError, memberContext }: BookingFormProps) {
  const [step, setStep] = useState(1)

  const [resourceTypeId, setResourceTypeId] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [startTimeLocal, setStartTimeLocal] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')

  const coveringMembership = useMemo(
    () => findCoveringMembership(memberContext, selectedDate, startTimeLocal),
    [memberContext, selectedDate, startTimeLocal],
  )
  const rateTier: RateTier = coveringMembership ? 'member' : 'non_member'
  const creditBalanceCentavos = coveringMembership?.creditBalanceCentavos ?? 0
  // The tier discount follows the term covering the slot, like every other member benefit.
  const discountPercent = coveringMembership?.bookingDiscountPercent ?? 0
  // Shown on the date step when a member has picked a day their membership won't cover.
  const membershipCoverageNotice =
    memberContext && memberContext.coverage.length > 0 && selectedDate && !coveringMembership
      ? `Your membership ends on ${memberContext.coverage[memberContext.coverage.length - 1].expiryDateLabel}. Dates after that are priced at non-member rates and can't use your booking credit — renew from your account to keep member pricing.`
      : null

  // Advance-booking window (docs/business.md): today + N days, where N comes from the term
  // covering that date and falls back to the non-member window. Mirrors POST /api/bookings.
  const todayKey = useMemo(() => toPhDateString(new Date()), [])
  const isDateDisabled = useCallback(
    (dateKey: string) => {
      const term = findTermForDate(memberContext, dateKey)
      const windowDays = term?.advanceBookingDays ?? NON_MEMBER_ADVANCE_BOOKING_DAYS
      return calendarDaysBetweenKeys(todayKey, dateKey) > windowDays
    },
    [memberContext, todayKey],
  )
  const advanceWindowNote = useMemo(() => {
    const term = memberContext?.coverage[0]
    if (!term) return `Bookings open up to ${NON_MEMBER_ADVANCE_BOOKING_DAYS} days ahead.`
    return `Your ${term.tierName} membership lets you book up to ${term.advanceBookingDays} days ahead. Dates your membership doesn't cover follow the ${NON_MEMBER_ADVANCE_BOOKING_DAYS}-day non-member window.`
  }, [memberContext])
  const [guestCount, setGuestCount] = useState(0)
  const [busy, setBusy] = useState<BusyRange[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coaching, setCoaching] = useState(false)
  const [coachingPaxCount, setCoachingPaxCount] = useState<number | null>(null)
  // Per-term perks apply by default; the member can untick either to keep it for later.
  const [useGuestPasses, setUseGuestPasses] = useState(true)
  const [useBirthdayPerk, setUseBirthdayPerk] = useState(true)

  const [showPayment, setShowPayment] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [createdTotalCentavos, setCreatedTotalCentavos] = useState<number | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [attachingCustomer, setAttachingCustomer] = useState(false)
  const [attachError, setAttachError] = useState<string | null>(null)
  const [customerAttached, setCustomerAttached] = useState(false)
  const [priceUpdate, setPriceUpdate] = useState<{
    originalCentavos: number
    finalCentavos: number
  } | null>(null)
  const [showInsufficientCreditModal, setShowInsufficientCreditModal] = useState(false)

  const selectedResourceType = useMemo(
    () => data?.resourceTypes.find((rt) => rt.id === resourceTypeId) ?? null,
    [data, resourceTypeId],
  )

  const isCourt = selectedResourceType?.category === 'court'

  const durationOptions = useMemo(() => {
    if (!selectedResourceType) return []
    return getDurationOptions(selectedResourceType)
  }, [selectedResourceType])

  // The guest cap follows the rate tier, which follows the chosen date (docs/business.md →
  // Guest Fee); handleDateSelect clamps the count when a date change lowers the cap.
  const maxGuests = maxGuestsForRateTier(rateTier)

  const coachingPricing = useMemo(
    () => getCoachingPricing(selectedResourceType, rateTier),
    [selectedResourceType, rateTier],
  )

  const coachingPriceCentavos = useMemo(() => {
    return coachingPricing.mode === 'flat'
      ? coachingPricing.flatPriceCentavos
      : coachingPricing.mode === 'paxTiered'
        ? coachingPaxCount === 1
          ? coachingPricing.pax1PriceCentavos
          : coachingPaxCount === 2
            ? coachingPricing.pax2PriceCentavos
            : null
        : null
  }, [coachingPricing, coachingPaxCount])

  function handleResourceTypeSelect(nextResourceTypeId: string) {
    const nextResourceType = data?.resourceTypes.find((resourceType) => resourceType.id === nextResourceTypeId)
    setResourceTypeId(nextResourceTypeId)
    setResourceId('')
    setGuestCount(0)
    setStartTimeLocal('')
    setAvailabilityLoading(false)
    setAvailabilityError(null)
    const durations = nextResourceType ? getDurationOptions(nextResourceType) : []
    setDurationMinutes(durations[0] !== undefined ? String(durations[0]) : '')
    setCoachingPaxCount(null)
    if (!getCoachingPricing(nextResourceType ?? null, rateTier).available) {
      setCoaching(false)
    }
  }

  function handleResourceSelect(nextResourceId: string) {
    setResourceId(nextResourceId)
    setStartTimeLocal('')
    setAvailabilityLoading(!!nextResourceId && !!selectedDate)
    setAvailabilityError(null)
  }

  function handleDurationChange(nextDurationMinutes: string) {
    setDurationMinutes(nextDurationMinutes)
    setStartTimeLocal('')
  }

  function handleDateSelect(nextSelectedDate: string) {
    setSelectedDate(nextSelectedDate)
    setStartTimeLocal('')
    setAvailabilityLoading(!!resourceId && !!nextSelectedDate)
    setAvailabilityError(null)

    // The rate tier follows the chosen date (a day past the membership's end is priced
    // non-member), which can remove member-only coaching.
    const nextRateTier: RateTier = findCoveringMembership(memberContext, nextSelectedDate, '')
      ? 'member'
      : 'non_member'
    if (nextRateTier !== rateTier && selectedResourceType) {
      if (coaching && !getCoachingPricing(selectedResourceType, nextRateTier).available) {
        setCoaching(false)
        setCoachingPaxCount(null)
      }
    }
    // A date outside every term drops the guest cap from the member to the non-member limit.
    const nextMaxGuests = maxGuestsForRateTier(nextRateTier)
    if (guestCount > nextMaxGuests) {
      setGuestCount(nextMaxGuests)
    }
  }

  function handleCoachingChange(value: boolean) {
    setCoaching(value)
    if (!value) setCoachingPaxCount(null)
  }

  useEffect(() => {
    if (!resourceId || !selectedDate) {
      return
    }
    let cancelled = false
    fetch(
      `/api/availability?resourceId=${encodeURIComponent(resourceId)}&date=${encodeURIComponent(selectedDate)}`,
    )
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load availability')
        return res.json() as Promise<{ busy: BusyRange[] }>
      })
      .then((json) => {
        if (cancelled) return
        setBusy(json.busy)
      })
      .catch(() => {
        if (cancelled) return
        setBusy([])
        setAvailabilityError('Could not load available times. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [resourceId, selectedDate])

  // Base court/simulator amount before any discount, from the base-rate rows.
  const baseEstimateCentavos = useMemo(() => {
    if (!selectedResourceType || !durationMinutes) return null
    const duration = Number(durationMinutes)
    if (isCourt) {
      const hourlyRate = selectedResourceType.pricing.find((p) => p.durationMinutes === 60)
      return hourlyRate ? hourlyRate.priceCentavos * (duration / 60) : null
    }
    const tierRate = selectedResourceType.pricing.find((p) => p.durationMinutes === duration)
    return tierRate ? tierRate.priceCentavos : null
  }, [selectedResourceType, durationMinutes, isCourt])

  // Guest passes: waive the fee for up to the term's remaining passes (docs/business.md).
  const guestPassesRemaining = coveringMembership?.guestPassesRemaining ?? 0
  const guestPassesApplied = useGuestPasses ? Math.min(guestCount, guestPassesRemaining) : 0

  // Birthday-month court hour: any 60-minute slot in the birthday month, once per term.
  const birthdayPerk = coveringMembership?.birthdayPerk ?? null
  const birthdayPerkEligible =
    !!birthdayPerk &&
    birthdayPerk.month !== null &&
    !birthdayPerk.used &&
    Number(durationMinutes) === 60 &&
    !!selectedDate &&
    Number(selectedDate.slice(5, 7)) === birthdayPerk.month
  const birthdayPerkApplied = birthdayPerkEligible && useBirthdayPerk

  // Same arithmetic as priceBooking: the birthday hour replaces the tier discount; passes
  // reduce the guest fee; neither touches coaching.
  const discountEstimateCentavos =
    baseEstimateCentavos === null
      ? 0
      : birthdayPerkApplied
        ? birthdayPerk!.kind === 'free'
          ? baseEstimateCentavos
          : Math.round(baseEstimateCentavos / 2)
        : tierDiscountCentavos(baseEstimateCentavos, discountPercent)
  const discountLabel = birthdayPerkApplied
    ? birthdayPerk!.kind === 'free'
      ? 'Birthday court hour — free'
      : 'Birthday court hour — 50% off'
    : `Member discount — ${discountPercent}%`
  const estimateCentavos = useMemo(() => {
    if (baseEstimateCentavos === null || !data) return null
    return (
      baseEstimateCentavos -
      discountEstimateCentavos +
      (guestCount - guestPassesApplied) * data.guestFeeCentavos
    )
  }, [baseEstimateCentavos, discountEstimateCentavos, guestCount, guestPassesApplied, data])

  const addOnsEstimateCentavos = useMemo(() => {
    let total = 0
    if (coaching) {
      if (isCourt) {
        const paxPrice =
          coachingPaxCount === 1
            ? coachingPricing.pax1PriceCentavos
            : coachingPaxCount === 2
              ? coachingPricing.pax2PriceCentavos
              : null
        if (paxPrice !== null) total += paxPrice
      } else if (coachingPricing.flatPriceCentavos !== null) {
        total += coachingPricing.flatPriceCentavos
      }
    }
    return total
  }, [coaching, coachingPaxCount, isCourt, coachingPricing])

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return !!resourceTypeId
      case 2:
        return !!resourceId
      case 3:
        return !!selectedDate && !!startTimeLocal && !!durationMinutes
      case 4:
        return !(coaching && isCourt && coachingPaxCount === null)
      default:
        return true
    }
  }, [
    step,
    resourceTypeId,
    resourceId,
    selectedDate,
    startTimeLocal,
    durationMinutes,
    coaching,
    isCourt,
    coachingPaxCount,
  ])

  async function startCheckout(id: string) {
    setCheckingOut(true)
    setCheckoutError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id }),
      })

      if (res.ok) {
        const json: { checkoutUrl: string } = await res.json()
        window.location.href = json.checkoutUrl
        return
      }

      const json = await res.json().catch(() => null)
      setCheckoutError(json?.error ?? 'Something went wrong starting checkout. Please try again.')
    } catch {
      setCheckoutError('Something went wrong starting checkout. Please try again.')
    } finally {
      setCheckingOut(false)
    }
  }

  async function handleConfirmBooking() {
    if (!resourceId || !durationMinutes || !startTimeLocal) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          startTime: new Date(startTimeLocal).toISOString(),
          durationMinutes: Number(durationMinutes),
          guestCount,
          coaching,
          ...(coaching && isCourt && coachingPaxCount !== null ? { coachingPaxCount } : {}),
          useGuestPasses,
          useBirthdayPerk,
        }),
      })

      if (res.status === 201) {
        const booking: {
          id: string
          totalAmountCentavos: number
          addOnsTotalCentavos: number
          customerAttached: boolean
          isMember: boolean
          creditCovered: boolean
        } = await res.json()
        if (booking.creditCovered) {
          window.location.href = `/book/confirmation?bookingId=${booking.id}`
          return
        }
        setBookingId(booking.id)
        setCreatedTotalCentavos(booking.totalAmountCentavos + booking.addOnsTotalCentavos)
        setShowPayment(true)
        if (booking.customerAttached) {
          setCustomerAttached(true)
        }
      } else if (res.status === 409) {
        const json = await res.json().catch(() => null)
        setSubmitError(
          typeof json?.error === 'string' && json.error.includes('guest passes')
            ? json.error
            : 'That slot was just booked by someone else — please pick a different time.',
        )
      } else if (res.status === 400 || res.status === 429) {
        const json = await res.json().catch(() => null)
        setSubmitError(json?.error ?? 'There was a problem with your booking details.')
      } else {
        setSubmitError('Something went wrong. Please try again.')
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleConfirmBookingClick() {
    if (rateTier === 'member' && memberContext && estimateCentavos !== null) {
      const totalCentavos = estimateCentavos + addOnsEstimateCentavos
      if (creditBalanceCentavos < totalCentavos) {
        setShowInsufficientCreditModal(true)
        return
      }
    }
    handleConfirmBooking()
  }

  async function handlePayNow() {
    if (!bookingId) return

    if (customerAttached) {
      await startCheckout(bookingId)
      return
    }

    if (!name.trim() || !phone.trim() || !email.trim()) return

    setAttachingCustomer(true)
    setAttachError(null)

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email }),
      })

      if (res.status === 200) {
        const json: {
          totalAmountCentavos: number
          addOnsTotalCentavos: number
          isMember: boolean
        } = await res.json()
        setCustomerAttached(true)
        const finalTotal = json.totalAmountCentavos + json.addOnsTotalCentavos
        if (createdTotalCentavos !== null && finalTotal !== createdTotalCentavos) {
          setPriceUpdate({
            originalCentavos: createdTotalCentavos,
            finalCentavos: finalTotal,
          })
        } else {
          await startCheckout(bookingId)
        }
      } else {
        const json = await res.json().catch(() => null)
        setAttachError(json?.error ?? 'Something went wrong confirming your details. Please try again.')
      }
    } catch {
      setAttachError('Something went wrong confirming your details. Please try again.')
    } finally {
      setAttachingCustomer(false)
    }
  }

  function handleStartOver() {
    setStep(1)
    setShowPayment(false)
    setBookingId(null)
    setCreatedTotalCentavos(null)
    setSubmitError(null)
    setAttachingCustomer(false)
    setAttachError(null)
    setCustomerAttached(false)
    setPriceUpdate(null)
    setShowInsufficientCreditModal(false)
    setCheckingOut(false)
    setCheckoutError(null)
    setResourceTypeId('')
    setResourceId('')
    setSelectedDate(null)
    setStartTimeLocal('')
    setDurationMinutes('')
    setGuestCount(0)
    setName('')
    setEmail('')
    setPhone('')
    setCoaching(false)
    setCoachingPaxCount(null)
    setUseGuestPasses(true)
    setUseBirthdayPerk(true)
  }

  if (loadError) {
    return <p className="text-red-600">{loadError}</p>
  }

  if (loading || !data) {
    return <p className="text-gray-500">Loading booking form…</p>
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6">
      {!showPayment && <StepIndicator currentStep={step} />}

      {step === 1 && (
        <SportStep
          resourceTypes={data.resourceTypes}
          resourceTypeId={resourceTypeId}
          onSelect={handleResourceTypeSelect}
          rateTier={rateTier}
          discountPercent={discountPercent}
        />
      )}

      {step === 2 && selectedResourceType && (
        <CourtStep
          resourceTypeName={selectedResourceType.name}
          resources={selectedResourceType.resources}
          resourceId={resourceId}
          onSelect={handleResourceSelect}
        />
      )}

      {step === 3 && (
        <DateTimeStep
          durationMinutes={durationMinutes}
          onDurationChange={handleDurationChange}
          durationOptions={durationOptions}
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          resourceCategory={selectedResourceType?.category ?? ''}
          resourceSlug={selectedResourceType?.slug ?? ''}
          busy={resourceId && selectedDate ? busy : []}
          availabilityLoading={!!resourceId && !!selectedDate && availabilityLoading}
          availabilityError={resourceId && selectedDate ? availabilityError : null}
          selectedSlot={startTimeLocal}
          onSelectSlot={setStartTimeLocal}
          membershipCoverageNotice={membershipCoverageNotice}
          isDateDisabled={isDateDisabled}
          advanceWindowNote={advanceWindowNote}
        />
      )}

      {step === 4 && (
        <AddOnsStep
          guestCount={guestCount}
          maxGuests={maxGuests}
          onGuestCountChange={setGuestCount}
          guestPassesRemaining={guestPassesRemaining}
          guestPassesApplied={guestPassesApplied}
          useGuestPasses={useGuestPasses}
          onUseGuestPassesChange={setUseGuestPasses}
          birthdayPerkEligible={birthdayPerkEligible}
          birthdayPerkKind={birthdayPerk?.kind ?? null}
          useBirthdayPerk={useBirthdayPerk}
          onUseBirthdayPerkChange={setUseBirthdayPerk}
          coaching={coaching}
          onCoachingChange={handleCoachingChange}
          coachingPricing={coachingPricing}
          coachingPaxCount={coachingPaxCount}
          onCoachingPaxCountChange={setCoachingPaxCount}
          coachingPriceCentavos={coachingPriceCentavos}
          guestFeeCentavos={data.guestFeeCentavos}
        />
      )}

      {step === 5 && !showPayment && (
        <ReviewStep
          resourceTypeName={selectedResourceType?.name ?? ''}
          resourceLabel={
            selectedResourceType?.resources.find((r) => r.id === resourceId)?.label ?? ''
          }
          startTimeLocal={startTimeLocal}
          durationMinutes={durationMinutes}
          isCourt={!!isCourt}
          guestCount={guestCount}
          coaching={coaching}
          coachingPaxCount={coachingPaxCount}
          coachingPriceCentavos={coachingPriceCentavos}
          estimateCentavos={estimateCentavos}
          discountEstimateCentavos={discountEstimateCentavos}
          discountLabel={discountLabel}
          guestPassesApplied={guestPassesApplied}
          addOnsEstimateCentavos={addOnsEstimateCentavos}
          guestFeeCentavos={data.guestFeeCentavos}
          submitting={submitting}
          submitError={submitError}
          onBack={() => setStep(4)}
          onConfirmBooking={handleConfirmBookingClick}
          rateTier={rateTier}
          hasSession={!!memberContext}
        />
      )}

      {step === 5 && !showPayment && (
        <Modal
          isOpen={showInsufficientCreditModal}
          onClose={() => setShowInsufficientCreditModal(false)}
          title="Your F&B Credit Won't Cover This"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              {creditBalanceCentavos === 0
                ? "You don't currently have any F&B credit available."
                : `Your F&B credit balance is ${formatCentavos(creditBalanceCentavos)}, which isn't enough to cover this booking.`}
              {' '}This booking totals {formatCentavos((estimateCentavos ?? 0) + addOnsEstimateCentavos)}.
              {"Since your credit doesn't fully cover it, none of it will be applied — you'll pay the"}
              full amount via PayMongo, and your credit balance will stay untouched.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowInsufficientCreditModal(false)}
                className="flex-1 rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInsufficientCreditModal(false)
                  handleConfirmBooking()
                }}
                className="flex-1 rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700"
              >
                Continue Booking
              </button>
            </div>
          </div>
        </Modal>
      )}

      {step === 5 && showPayment && bookingId && (
        <PaymentStep
          resourceTypeName={selectedResourceType?.name ?? ''}
          resourceLabel={
            selectedResourceType?.resources.find((r) => r.id === resourceId)?.label ?? ''
          }
          startTimeLocal={startTimeLocal}
          durationMinutes={durationMinutes}
          isCourt={!!isCourt}
          guestCount={guestCount}
          coaching={coaching}
          coachingPaxCount={coachingPaxCount}
          coachingPriceCentavos={coachingPriceCentavos}
          estimateCentavos={estimateCentavos}
          discountEstimateCentavos={discountEstimateCentavos}
          discountLabel={discountLabel}
          guestPassesApplied={guestPassesApplied}
          addOnsEstimateCentavos={addOnsEstimateCentavos}
          guestFeeCentavos={data.guestFeeCentavos}
          name={name}
          onNameChange={setName}
          phone={phone}
          onPhoneChange={setPhone}
          email={email}
          onEmailChange={setEmail}
          bookingId={bookingId}
          attachingCustomer={attachingCustomer}
          attachError={attachError}
          customerAttached={customerAttached}
          priceUpdate={priceUpdate}
          checkingOut={checkingOut}
          checkoutError={checkoutError}
          onPayNow={handlePayNow}
          onStartOver={handleStartOver}
          knownCustomer={memberContext ? { name: memberContext.name, email: memberContext.email } : null}
          rateTier={rateTier}
          hasSession={!!memberContext}
        />
      )}

      {step < TOTAL_STEPS && (
        <div className="flex w-full max-w-md gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            disabled={!canContinue}
            className="flex-1 rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
