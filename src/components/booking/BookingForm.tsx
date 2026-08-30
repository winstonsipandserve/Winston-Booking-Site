'use client'

import { useEffect, useMemo, useState } from 'react'
import StepIndicator from './steps/StepIndicator'
import SportStep from './steps/SportStep'
import CourtStep from './steps/CourtStep'
import DateTimeStep from './steps/DateTimeStep'
import AddOnsStep from './steps/AddOnsStep'
import ReviewStep from './steps/ReviewStep'
import PaymentStep from './steps/PaymentStep'

type RateTier = 'member' | 'non_member'
type ResourceCategory = 'court' | 'simulator'

interface PricingTier {
  rateTier: RateTier
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

interface BallBoyPricing {
  available: boolean
  priceCentavos: number | null
}

interface CoachingPricing {
  available: boolean
  mode: 'flat' | 'paxTiered' | null
  flatPriceCentavos: number | null
  pax1PriceCentavos: number | null
  pax2PriceCentavos: number | null
}

const EMPTY_BALL_BOY_PRICING: BallBoyPricing = { available: false, priceCentavos: null }
const EMPTY_COACHING_PRICING: CoachingPricing = {
  available: false,
  mode: null,
  flatPriceCentavos: null,
  pax1PriceCentavos: null,
  pax2PriceCentavos: null,
}

function getBallBoyPricing(
  resourceType: ResourceTypeOption | null,
  rateTier: RateTier,
): BallBoyPricing {
  if (!resourceType) return EMPTY_BALL_BOY_PRICING
  const rule = resourceType.addOnPricing.find(
    (a) => a.service === 'ball_boy' && a.rateTier === rateTier,
  )
  return rule ? { available: true, priceCentavos: rule.priceCentavos } : EMPTY_BALL_BOY_PRICING
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

const COURT_DURATIONS_MINUTES = [60, 120, 180, 240]
const TOTAL_STEPS = 5

function getDurationOptions(resourceType: ResourceTypeOption, rateTier: RateTier): number[] {
  if (resourceType.category === 'court') return COURT_DURATIONS_MINUTES
  return Array.from(
    new Set(
      resourceType.pricing.filter((p) => p.rateTier === rateTier).map((p) => p.durationMinutes),
    ),
  ).sort((a, b) => a - b)
}

interface MemberContext {
  name: string
  email: string
  phone: string
  isActiveMember: boolean
}

interface BookingFormProps {
  data: ResourcesResponse | null
  loading: boolean
  loadError: string | null
  memberContext: MemberContext | null
}

export default function BookingForm({ data, loading, loadError, memberContext }: BookingFormProps) {
  const [step, setStep] = useState(1)

  const rateTier: RateTier = memberContext?.isActiveMember ? 'member' : 'non_member'

  const [resourceTypeId, setResourceTypeId] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [startTimeLocal, setStartTimeLocal] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [guestCount, setGuestCount] = useState(0)
  const [busy, setBusy] = useState<BusyRange[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [ballBoy, setBallBoy] = useState(false)
  const [coaching, setCoaching] = useState(false)
  const [coachingPaxCount, setCoachingPaxCount] = useState<number | null>(null)

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
    guestFeeWaived: boolean
  } | null>(null)

  const selectedResourceType = useMemo(
    () => data?.resourceTypes.find((rt) => rt.id === resourceTypeId) ?? null,
    [data, resourceTypeId],
  )

  const isCourt = selectedResourceType?.category === 'court'

  const durationOptions = useMemo(() => {
    if (!selectedResourceType) return []
    return getDurationOptions(selectedResourceType, rateTier)
  }, [selectedResourceType, rateTier])

  const ballBoyPricing = useMemo(
    () => getBallBoyPricing(selectedResourceType, rateTier),
    [selectedResourceType, rateTier],
  )
  const coachingPricing = useMemo(
    () => getCoachingPricing(selectedResourceType, rateTier),
    [selectedResourceType, rateTier],
  )

  // Reset dependent fields whenever the chosen resource type changes.
  useEffect(() => {
    if (!selectedResourceType) return
    setResourceId('')
    setGuestCount(0)
    const durations = getDurationOptions(selectedResourceType, rateTier)
    setDurationMinutes(durations[0] !== undefined ? String(durations[0]) : '')
    if (selectedResourceType.category !== 'court') {
      setBallBoy(false)
    }
    setCoachingPaxCount(null)
    if (!getCoachingPricing(selectedResourceType, rateTier).available) {
      setCoaching(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceTypeId])

  function handleCoachingChange(value: boolean) {
    setCoaching(value)
    if (!value) setCoachingPaxCount(null)
  }

  // Reset the chosen slot whenever any input that could invalidate it changes.
  useEffect(() => {
    setStartTimeLocal('')
  }, [resourceId, selectedDate, durationMinutes])

  useEffect(() => {
    if (!resourceId || !selectedDate) {
      setBusy([])
      return
    }
    let cancelled = false
    setAvailabilityLoading(true)
    setAvailabilityError(null)
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

  const estimateCentavos = useMemo(() => {
    if (!selectedResourceType || !durationMinutes || !data) return null
    const duration = Number(durationMinutes)
    if (isCourt) {
      const hourlyRate = selectedResourceType.pricing.find(
        (p) => p.rateTier === rateTier && p.durationMinutes === 60,
      )
      if (!hourlyRate) return null
      const base = hourlyRate.priceCentavos * (duration / 60)
      const guestFee = guestCount * data.guestFeeCentavos
      return base + guestFee
    }
    const tierRate = selectedResourceType.pricing.find(
      (p) => p.rateTier === rateTier && p.durationMinutes === duration,
    )
    return tierRate ? tierRate.priceCentavos : null
  }, [selectedResourceType, durationMinutes, guestCount, isCourt, data, rateTier])

  const addOnsEstimateCentavos = useMemo(() => {
    let total = 0
    if (ballBoy && ballBoyPricing.priceCentavos !== null) {
      total += ballBoyPricing.priceCentavos
    }
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
  }, [ballBoy, coaching, coachingPaxCount, isCourt, ballBoyPricing, coachingPricing])

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
          guestCount: isCourt && rateTier === 'non_member' ? guestCount : 0,
          ballBoy,
          coaching,
          ...(coaching && isCourt && coachingPaxCount !== null ? { coachingPaxCount } : {}),
        }),
      })

      if (res.status === 201) {
        const booking: {
          id: string
          totalAmountCentavos: number
          addOnsTotalCentavos: number
          customerAttached: boolean
          isMember: boolean
        } = await res.json()
        setBookingId(booking.id)
        setCreatedTotalCentavos(booking.totalAmountCentavos + booking.addOnsTotalCentavos)
        setShowPayment(true)
        if (booking.customerAttached) {
          setCustomerAttached(true)
        }
      } else if (res.status === 409) {
        setSubmitError('That slot was just booked by someone else — please pick a different time.')
      } else if (res.status === 400) {
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
          guestFeeWaived: boolean
        } = await res.json()
        setCustomerAttached(true)
        const finalTotal = json.totalAmountCentavos + json.addOnsTotalCentavos
        if (createdTotalCentavos !== null && finalTotal !== createdTotalCentavos) {
          setPriceUpdate({
            originalCentavos: createdTotalCentavos,
            finalCentavos: finalTotal,
            guestFeeWaived: json.guestFeeWaived,
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
    setBallBoy(false)
    setCoaching(false)
    setCoachingPaxCount(null)
  }

  if (loadError) {
    return <p className="text-red-600">{loadError}</p>
  }

  if (loading || !data) {
    return <p className="text-brand-dark/60">Loading booking form…</p>
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-8">
      {!showPayment && <StepIndicator currentStep={step} />}

      {step === 1 && (
        <SportStep
          resourceTypes={data.resourceTypes}
          resourceTypeId={resourceTypeId}
          onSelect={setResourceTypeId}
          rateTier={rateTier}
        />
      )}

      {step === 2 && selectedResourceType && (
        <CourtStep
          resourceTypeName={selectedResourceType.name}
          resources={selectedResourceType.resources}
          resourceId={resourceId}
          onSelect={setResourceId}
        />
      )}

      {step === 3 && (
        <DateTimeStep
          durationMinutes={durationMinutes}
          onDurationChange={setDurationMinutes}
          durationOptions={durationOptions}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          resourceCategory={selectedResourceType?.category ?? ''}
          resourceSlug={selectedResourceType?.slug ?? ''}
          busy={busy}
          availabilityLoading={availabilityLoading}
          availabilityError={availabilityError}
          selectedSlot={startTimeLocal}
          onSelectSlot={setStartTimeLocal}
        />
      )}

      {step === 4 && (
        <AddOnsStep
          isCourt={!!isCourt}
          guestCount={guestCount}
          onGuestCountChange={setGuestCount}
          ballBoy={ballBoy}
          onBallBoyChange={setBallBoy}
          ballBoyPricing={ballBoyPricing}
          coaching={coaching}
          onCoachingChange={handleCoachingChange}
          coachingPricing={coachingPricing}
          coachingPaxCount={coachingPaxCount}
          onCoachingPaxCountChange={setCoachingPaxCount}
          hideGuestCount={rateTier === 'member'}
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
          ballBoy={ballBoy}
          ballBoyPriceCentavos={ballBoyPricing.priceCentavos}
          coaching={coaching}
          coachingPaxCount={coachingPaxCount}
          estimateCentavos={estimateCentavos}
          addOnsEstimateCentavos={addOnsEstimateCentavos}
          submitting={submitting}
          submitError={submitError}
          onBack={() => setStep(4)}
          onConfirmBooking={handleConfirmBooking}
        />
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
          ballBoy={ballBoy}
          ballBoyPriceCentavos={ballBoyPricing.priceCentavos}
          coaching={coaching}
          coachingPaxCount={coachingPaxCount}
          estimateCentavos={estimateCentavos}
          addOnsEstimateCentavos={addOnsEstimateCentavos}
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
        />
      )}

      {step < TOTAL_STEPS && (
        <div className="flex w-full max-w-md gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-none border border-brand-dark/20 px-5 py-3 text-sm font-medium uppercase tracking-wide text-brand-dark/70 transition-colors hover:bg-brand-dark/5 hover:text-brand-dark"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            disabled={!canContinue}
            className="flex-1 rounded-none bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
