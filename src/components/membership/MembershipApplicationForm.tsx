'use client'

import { useState } from 'react'

type MembershipTier = 'three_month' | 'six_month' | 'twelve_month'

const TIER_OPTIONS: { value: MembershipTier; label: string; price: string }[] = [
  { value: 'three_month', label: '3-Month', price: '₱5,500' },
  { value: 'six_month', label: '6-Month', price: '₱12,500' },
  { value: 'twelve_month', label: '12-Month', price: '₱22,500' },
]

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ACCEPTED_FILE_TYPES = 'image/jpeg,image/png'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

interface SuccessResult {
  id: string
}

function inputClassName() {
  return 'rounded-input border border-brand-dark/20 bg-brand-light px-3 py-2 text-brand-dark placeholder:text-brand-dark/40 focus:border-accent-primary focus:outline-none disabled:opacity-50'
}

export default function MembershipApplicationForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [requestedTier, setRequestedTier] = useState<MembershipTier>('three_month')

  const [govIdFront, setGovIdFront] = useState<File | null>(null)
  const [govIdBack, setGovIdBack] = useState<File | null>(null)
  const [govIdSelfie, setGovIdSelfie] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null)

  function handleFileChange(label: string, setFile: (file: File | null) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      if (file && file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(`${label} must be 5MB or smaller`)
        setFile(null)
        e.target.value = ''
        return
      }
      setFileError(null)
      setFile(file)
    }
  }

  const isValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    address.trim().length > 0 &&
    !!govIdFront &&
    !!govIdBack &&
    !!govIdSelfie

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || !govIdFront || !govIdBack || !govIdSelfie) return

    setSubmitState('submitting')
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.set('name', name)
      formData.set('email', email)
      formData.set('phone', phone)
      formData.set('address', address)
      formData.set('requestedTier', requestedTier)
      formData.set('govIdFront', govIdFront)
      formData.set('govIdBack', govIdBack)
      formData.set('govIdSelfie', govIdSelfie)

      const res = await fetch('/api/membership-applications', {
        method: 'POST',
        body: formData,
      })

      if (res.status === 201) {
        const json: { id: string } = await res.json()
        setSuccessResult({ id: json.id })
        setSubmitState('success')
      } else if (res.status === 409) {
        const json = await res.json().catch(() => null)
        setSubmitError(json?.error ?? 'An application is already pending for this email.')
        setSubmitState('error')
      } else if (res.status === 400) {
        const json = await res.json().catch(() => null)
        setSubmitError(json?.error ?? 'There was a problem with your application details.')
        setSubmitState('error')
      } else {
        setSubmitError('Something went wrong. Please try again.')
        setSubmitState('error')
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.')
      setSubmitState('error')
    }
  }

  if (submitState === 'success' && successResult) {
    return (
      <div className="flex w-full max-w-md flex-col gap-4 rounded-card border border-brand-dark/10 bg-brand-light px-6 py-6 text-center shadow-xl shadow-brand-dark/10">
        <h2 className="font-serif text-2xl text-brand-dark">Application Submitted</h2>
        <p className="text-sm text-brand-dark/60">
          Application ID: <span className="font-medium text-brand-dark">{successResult.id}</span>
        </p>
        <p className="text-sm text-brand-dark/70">
          Your application is now pending review. Our team reviews applications manually —
          we&apos;ll email you once a decision is made. There&apos;s no account or dashboard to
          check status yet.
        </p>
      </div>
    )
  }

  const submitting = submitState === 'submitting'

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-4 rounded-card border border-brand-dark/10 bg-brand-light px-6 py-6 shadow-xl shadow-brand-dark/10"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-brand-dark">
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          disabled={submitting}
          onChange={(e) => setName(e.target.value)}
          className={inputClassName()}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-brand-dark">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          disabled={submitting}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClassName()}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-brand-dark">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          required
          value={phone}
          disabled={submitting}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClassName()}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium text-brand-dark">
          Address
        </label>
        <input
          id="address"
          type="text"
          required
          value={address}
          disabled={submitting}
          onChange={(e) => setAddress(e.target.value)}
          className={inputClassName()}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-brand-dark">Membership Tier</span>
        <div className="flex flex-col gap-2">
          {TIER_OPTIONS.map((tier) => {
            const isSelected = requestedTier === tier.value
            return (
              <label
                key={tier.value}
                className={`flex cursor-pointer items-center justify-between rounded-none px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? 'border-2 border-accent-primary bg-accent-primary/10'
                    : 'border border-brand-dark/20 bg-brand-light hover:bg-brand-dark/5'
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="requestedTier"
                    value={tier.value}
                    checked={isSelected}
                    disabled={submitting}
                    onChange={() => setRequestedTier(tier.value)}
                  />
                  <span className={`text-brand-dark ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                    {tier.label}
                  </span>
                </span>
                <span className="text-sm font-semibold text-accent-primary">{tier.price}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-brand-dark">Government ID</span>

        <div className="flex flex-col gap-1">
          <label htmlFor="govIdFront" className="text-xs text-brand-dark/60">
            Front
          </label>
          <input
            id="govIdFront"
            type="file"
            required
            accept={ACCEPTED_FILE_TYPES}
            disabled={submitting}
            onChange={handleFileChange('Government ID (front)', setGovIdFront)}
            className="text-sm text-brand-dark file:mr-3 file:rounded-none file:border-0 file:bg-accent-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="govIdBack" className="text-xs text-brand-dark/60">
            Back
          </label>
          <input
            id="govIdBack"
            type="file"
            required
            accept={ACCEPTED_FILE_TYPES}
            disabled={submitting}
            onChange={handleFileChange('Government ID (back)', setGovIdBack)}
            className="text-sm text-brand-dark file:mr-3 file:rounded-none file:border-0 file:bg-accent-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="govIdSelfie" className="text-xs text-brand-dark/60">
            Selfie with ID
          </label>
          <input
            id="govIdSelfie"
            type="file"
            required
            accept={ACCEPTED_FILE_TYPES}
            disabled={submitting}
            onChange={handleFileChange('Selfie with ID', setGovIdSelfie)}
            className="text-sm text-brand-dark file:mr-3 file:rounded-none file:border-0 file:bg-accent-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-primary"
          />
        </div>
      </div>

      {fileError && <p className="text-sm text-red-600">{fileError}</p>}
      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={!isValid || submitting}
        className="w-full rounded-none bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  )
}
