'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import { formatWholePesos } from '@/lib/format'
import {
  FOUNDING_MEMBER_CAP,
  FOUNDING_PREMIER_PRICE_CENTAVOS,
  MEMBERSHIP_TIER_ORDER,
  MEMBERSHIP_TIER_PLANS,
} from '@/lib/membership-pricing'
import type { MembershipTier } from '@prisma/client'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ACCEPTED_FILE_TYPES = 'image/jpeg,image/png'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

interface SuccessResult {
  id: string
}

type UploadSlot = 'govIdFront' | 'govIdBack' | 'govIdSelfie'

type SignedUpload = {
  slot: UploadSlot
  contentType: string
  signedUrl: string
}

function inputClassName() {
  return 'rounded-input border border-brand-dark/20 bg-brand-light px-3 py-2 text-brand-dark placeholder:text-brand-dark/40 focus:border-accent-primary focus:outline-none disabled:opacity-50'
}

interface MembershipApplicationFormProps {
  /** Founding Member seats still open (docs/business.md → Founding Members). */
  foundingSeatsRemaining: number
}

export default function MembershipApplicationForm({ foundingSeatsRemaining }: MembershipApplicationFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [requestedTier, setRequestedTier] = useState<MembershipTier>('player')

  const tierOptions = MEMBERSHIP_TIER_ORDER.map((value) => {
    const plan = MEMBERSHIP_TIER_PLANS[value]
    const founding = value === 'premier' && foundingSeatsRemaining > 0
    return {
      value,
      label: plan.name,
      price: `${formatWholePesos(founding ? FOUNDING_PREMIER_PRICE_CENTAVOS : plan.totalCentavos)}/yr`,
      note: founding
        ? `Founding Member price · ${foundingSeatsRemaining} of ${FOUNDING_MEMBER_CAP} seats left`
        : null,
    }
  })

  const [govIdFront, setGovIdFront] = useState<File | null>(null)
  const [govIdBack, setGovIdBack] = useState<File | null>(null)
  const [govIdSelfie, setGovIdSelfie] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null)
  const [showDuplicateEmailModal, setShowDuplicateEmailModal] = useState(false)
  const [duplicateEmailMessage, setDuplicateEmailMessage] = useState('')

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
    dateOfBirth.length > 0 &&
    !!govIdFront &&
    !!govIdBack &&
    !!govIdSelfie

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || !govIdFront || !govIdBack || !govIdSelfie) return

    setSubmitState('submitting')
    setSubmitError(null)

    let uploadSessionId: string | null = null
    try {
      const files: Record<UploadSlot, File> = { govIdFront, govIdBack, govIdSelfie }
      const uploadRequest = await fetch('/api/membership-application-uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploads: (Object.entries(files) as [UploadSlot, File][]).map(([slot, file]) => ({
            slot,
            contentType: file.type,
            size: file.size,
          })),
        }),
      })

      if (uploadRequest.status !== 201) {
        const json = await uploadRequest.json().catch(() => null)
        setSubmitError(json?.error ?? 'Unable to prepare secure document uploads. Please try again.')
        setSubmitState('error')
        return
      }

      const uploadPayload = (await uploadRequest.json()) as { sessionId: string; uploads: SignedUpload[] }
      uploadSessionId = uploadPayload.sessionId
      await Promise.all(
        uploadPayload.uploads.map(async ({ slot, contentType, signedUrl }) => {
          const file = files[slot]
          if (!file || file.type !== contentType) throw new Error('The selected document changed before upload.')
          const upload = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'max-age=3600',
              'x-upsert': 'false',
            },
            body: file,
          })
          if (!upload.ok) throw new Error('Secure document upload failed.')
        }),
      )

      const res = await fetch('/api/membership-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          dateOfBirth,
          requestedTier,
          uploadSessionId,
          uploads: uploadPayload.uploads.map(({ slot, contentType }) => ({ slot, contentType })),
        }),
      })

      if (res.status === 201) {
        const json: { id: string } = await res.json()
        setSuccessResult({ id: json.id })
        setSubmitState('success')
      } else if (res.status === 409) {
        const json = await res.json().catch(() => null)
        setDuplicateEmailMessage(json?.error ?? 'An application is already pending for this email.')
        setShowDuplicateEmailModal(true)
        setSubmitState('idle')
      } else if (res.status === 400 || res.status === 413 || res.status === 429) {
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
      if (uploadSessionId) {
        void fetch('/api/membership-application-uploads', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: uploadSessionId }),
        })
      }
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
    <>
    <LoadingOverlay isOpen={submitting} label="Submitting…" />
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

      <div className="flex flex-col gap-1">
        <label htmlFor="dateOfBirth" className="text-sm font-medium text-brand-dark">
          Date of birth
        </label>
        <input
          id="dateOfBirth"
          type="date"
          required
          max={new Date().toISOString().slice(0, 10)}
          value={dateOfBirth}
          disabled={submitting}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className={inputClassName()}
        />
        <p className="text-xs text-brand-dark/60">
          Used for your complimentary birthday-month court hour.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-brand-dark">Membership Tier</span>
        <div className="flex flex-col gap-2">
          {tierOptions.map((tier) => {
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
                  <span className="flex flex-col">
                    <span className={`text-brand-dark ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                      {tier.label}
                    </span>
                    {tier.note && <span className="text-xs text-brand-dark/60">{tier.note}</span>}
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
        Submit Application
      </button>
    </form>

    <Modal
      isOpen={showDuplicateEmailModal}
      onClose={() => setShowDuplicateEmailModal(false)}
      title="Application Not Submitted"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-brand-dark/80">{duplicateEmailMessage}</p>
        <button
          type="button"
          onClick={() => setShowDuplicateEmailModal(false)}
          className="w-full rounded-none bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark"
        >
          Okay
        </button>
      </div>
    </Modal>
    </>
  )
}
