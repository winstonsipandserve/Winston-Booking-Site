'use client'

import { useEffect, useMemo, useState } from 'react'
import BookingConfirmation, { type BookingSuccess } from './BookingConfirmation'
import StepIndicator from './steps/StepIndicator'
import SportStep from './steps/SportStep'
import CourtStep from './steps/CourtStep'
import DateTimeStep from './steps/DateTimeStep'
import DetailsStep from './steps/DetailsStep'
import AddOnsStep from './steps/AddOnsStep'
import ReviewStep from './steps/ReviewStep'

type RateTier = 'member' | 'non_member'
type ResourceCategory = 'court' | 'simulator'

interface PricingTier {
  rateTier: RateTier
  durationMinutes: number
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
}

interface ResourcesResponse {
  resourceTypes: ResourceTypeOption[]
  guestFeeCentavos: number
}

interface BusyRange {
  start: string
  end: string
}

const COURT_DURATIONS_MINUTES = [60, 120, 180, 240]
const TOTAL_STEPS = 6

function getDurationOptions(resourceType: ResourceTypeOption): number[] {
  if (resourceType.category === 'court') return COURT_DURATIONS_MINUTES
  return Array.from(
    new Set(
      resourceType.pricing
        .filter((p) => p.rateTier === 'non_member')
        .map((p) => p.durationMinutes),
    ),
  ).sort((a, b) => a - b)
}

export default function BookingForm() {
  const [data, setData] = useState<ResourcesResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [step, setStep] = useState(1)

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

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<{
    booking: BookingSuccess
    resourceLabel: string
    resourceTypeName: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/resources')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load resources')
        return res.json() as Promise<ResourcesResponse>
      })
      .then((json) => {
        if (cancelled) return
        setData(json)
        if (json.resourceTypes.length > 0) {
          setResourceTypeId(json.resourceTypes[0].id)
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load resources. Please refresh the page.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedResourceType = useMemo(
    () => data?.resourceTypes.find((rt) => rt.id === resourceTypeId) ?? null,
    [data, resourceTypeId],
  )

  const isCourt = selectedResourceType?.category === 'court'

  const durationOptions = useMemo(() => {
    if (!selectedResourceType) return []
    return getDurationOptions(selectedResourceType)
  }, [selectedResourceType])

  // Reset dependent fields whenever the chosen resource type changes.
  useEffect(() => {
    if (!selectedResourceType) return
    setResourceId(selectedResourceType.resources[0]?.id ?? '')
    setGuestCount(0)
    const durations = getDurationOptions(selectedResourceType)
    setDurationMinutes(durations[0] !== undefined ? String(durations[0]) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceTypeId])

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
        (p) => p.rateTier === 'non_member' && p.durationMinutes === 60,
      )
      if (!hourlyRate) return null
      const base = hourlyRate.priceCentavos * (duration / 60)
      const guestFee = guestCount * data.guestFeeCentavos
      return base + guestFee
    }
    const tierRate = selectedResourceType.pricing.find(
      (p) => p.rateTier === 'non_member' && p.durationMinutes === duration,
    )
    return tierRate ? tierRate.priceCentavos : null
  }, [selectedResourceType, durationMinutes, guestCount, isCourt, data])

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return !!resourceTypeId
      case 2:
        return !!resourceId
      case 3:
        return !!selectedDate && !!startTimeLocal && !!durationMinutes
      case 4:
        return name.trim().length > 0 && phone.trim().length > 0 && email.trim().length > 0
      case 5:
        return true
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
    name,
    phone,
    email,
  ])

  async function handleConfirm() {
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
          guestCount: isCourt ? guestCount : 0,
          customer: { name, email, phone },
        }),
      })

      if (res.status === 201) {
        const booking: BookingSuccess = await res.json()
        const resource = selectedResourceType?.resources.find((r) => r.id === resourceId)
        setConfirmation({
          booking,
          resourceLabel: resource?.label ?? '',
          resourceTypeName: selectedResourceType?.name ?? '',
        })
        return
      }

      if (res.status === 409) {
        setSubmitError('That slot was just booked by someone else — please pick a different time.')
        return
      }

      if (res.status === 400) {
        const json = await res.json().catch(() => null)
        setSubmitError(json?.error ?? 'There was a problem with your booking details.')
        return
      }

      setSubmitError('Something went wrong. Please try again.')
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmation) {
    return (
      <BookingConfirmation
        booking={confirmation.booking}
        resourceLabel={confirmation.resourceLabel}
        resourceTypeName={confirmation.resourceTypeName}
      />
    )
  }

  if (loadError) {
    return <p className="text-red-600">{loadError}</p>
  }

  if (!data) {
    return <p className="text-zinc-600 dark:text-zinc-400">Loading booking form…</p>
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-8">
      <StepIndicator currentStep={step} />

      {step === 1 && (
        <SportStep
          resourceTypes={data.resourceTypes}
          resourceTypeId={resourceTypeId}
          onSelect={setResourceTypeId}
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
        <DetailsStep
          isCourt={!!isCourt}
          guestCount={guestCount}
          onGuestCountChange={setGuestCount}
          name={name}
          onNameChange={setName}
          phone={phone}
          onPhoneChange={setPhone}
          email={email}
          onEmailChange={setEmail}
        />
      )}

      {step === 5 && (
        <AddOnsStep
          isCourt={!!isCourt}
          ballBoy={ballBoy}
          onBallBoyChange={setBallBoy}
          coaching={coaching}
          onCoachingChange={setCoaching}
        />
      )}

      {step === 6 && (
        <ReviewStep
          resourceTypeName={selectedResourceType?.name ?? ''}
          resourceLabel={
            selectedResourceType?.resources.find((r) => r.id === resourceId)?.label ?? ''
          }
          startTimeLocal={startTimeLocal}
          durationMinutes={durationMinutes}
          isCourt={!!isCourt}
          guestCount={guestCount}
          name={name}
          phone={phone}
          email={email}
          ballBoy={ballBoy}
          coaching={coaching}
          estimateCentavos={estimateCentavos}
          submitting={submitting}
          submitError={submitError}
          onBack={() => setStep(5)}
          onConfirm={handleConfirm}
        />
      )}

      {step < 6 && (
        <div className="flex w-full max-w-md gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-full border border-black/[.145] px-5 py-3 text-base font-medium transition-colors hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.04]"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            disabled={!canContinue}
            className="flex-1 rounded-full bg-foreground px-5 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
