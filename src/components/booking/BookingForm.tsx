'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatCentavos } from '@/lib/format'
import BookingConfirmation, { type BookingSuccess } from './BookingConfirmation'

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

const COURT_DURATIONS_MINUTES = [60, 120, 180]

export default function BookingForm() {
  const [data, setData] = useState<ResourcesResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [resourceTypeId, setResourceTypeId] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [startTimeLocal, setStartTimeLocal] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [guestCount, setGuestCount] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

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
    if (selectedResourceType.category === 'court') return COURT_DURATIONS_MINUTES
    return Array.from(new Set(selectedResourceType.pricing.map((p) => p.durationMinutes))).sort(
      (a, b) => a - b,
    )
  }, [selectedResourceType])

  // Reset dependent fields whenever the chosen resource type changes.
  useEffect(() => {
    if (!selectedResourceType) return
    setResourceId(selectedResourceType.resources[0]?.id ?? '')
    setGuestCount(0)
    const durations =
      selectedResourceType.category === 'court'
        ? COURT_DURATIONS_MINUTES
        : Array.from(new Set(selectedResourceType.pricing.map((p) => p.durationMinutes))).sort(
            (a, b) => a - b,
          )
    setDurationMinutes(durations[0] !== undefined ? String(durations[0]) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceTypeId])

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
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
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="resourceType" className="text-sm font-medium">
          Resource type
        </label>
        <select
          id="resourceType"
          value={resourceTypeId}
          onChange={(e) => setResourceTypeId(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
        >
          {data.resourceTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="resource" className="text-sm font-medium">
          Court / bay
        </label>
        <select
          id="resource"
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
        >
          {selectedResourceType?.resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="startTime" className="text-sm font-medium">
          Date &amp; time
        </label>
        <input
          id="startTime"
          type="datetime-local"
          required
          value={startTimeLocal}
          onChange={(e) => setStartTimeLocal(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="duration" className="text-sm font-medium">
          Duration
        </label>
        <select
          id="duration"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
        >
          {durationOptions.map((d) => (
            <option key={d} value={d}>
              {d} minutes
            </option>
          ))}
        </select>
      </div>

      {isCourt && (
        <div className="flex flex-col gap-1">
          <label htmlFor="guestCount" className="text-sm font-medium">
            Number of guests
          </label>
          <input
            id="guestCount"
            type="number"
            min={0}
            value={guestCount}
            onChange={(e) => setGuestCount(Math.max(0, Number(e.target.value)))}
            className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
        />
      </div>

      <div className="rounded border border-black/[.08] bg-black/[.03] px-3 py-2 text-sm dark:border-white/[.08] dark:bg-white/[.04]">
        {estimateCentavos !== null ? (
          <>
            <p className="font-medium">Estimated price: {formatCentavos(estimateCentavos)}</p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Estimated at non-member rate — your final price reflects any active membership.
            </p>
          </>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No estimate available for this combination — your final price will be confirmed on submit.
          </p>
        )}
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-foreground px-5 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {submitting ? 'Booking…' : 'Book Now'}
      </button>
    </form>
  )
}
