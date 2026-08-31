'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatCentavos } from '@/lib/format'
import { CheckIcon } from '@/components/ui/Icons'
import Modal from '@/components/ui/Modal'

// Perks copied verbatim from PROJECT_CONTEXT.md's Membership Tiers → Perks line.
const PERKS = ['Priority bookings', 'Facility use', 'Complimentary F&B (via credit)', 'Exclusive event access']

type MembershipStatusCardProps =
  | {
      membership: null
      customerId: string
    }
  | {
      membership: {
        tierName: string
        activationCentavos: number
        creditCentavos: number
        remainingCreditCentavos: number
        expiryDateLabel: string
        isExpired: boolean
      }
      customerId: string
      qrCodeDataUrl: string
      checkInCode: string
    }

export default function MembershipStatusCard(props: MembershipStatusCardProps) {
  const { membership } = props
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false)
  const [currentQrDataUrl, setCurrentQrDataUrl] = useState(
    membership ? props.qrCodeDataUrl : '',
  )
  const [currentCheckInCode, setCurrentCheckInCode] = useState(
    membership ? props.checkInCode : '',
  )
  const [regenerateError, setRegenerateError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRegenerateConfirm() {
    setRegenerateError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/account/check-in-token/regenerate', { method: 'POST' })
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          setRegenerateError(json?.error ?? 'Something went wrong. Please try again.')
          return
        }
        setCurrentQrDataUrl(json.qrCodeDataUrl)
        setCurrentCheckInCode(json.checkInCode)
        setRegenerateModalOpen(false)
      } catch {
        setRegenerateError('Something went wrong. Please try again.')
      }
    })
  }

  if (!membership) {
    return (
      <div className="flex flex-col rounded-2xl bg-brand-dark px-6 py-6 shadow-card">
        <div className="flex items-center gap-3">
          <Image
            src="/images/brand/winston-logo-emblem-transparent.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain brightness-0 invert"
          />
          <h2 className="font-serif text-xl text-neutral-100">Membership Status</h2>
        </div>
        <p className="mt-4 text-sm text-accent-light/80">No active membership on file.</p>
      </div>
    )
  }

  const creditPct = Math.round((membership.remainingCreditCentavos / membership.creditCentavos) * 100)

  return (
    <div className="flex flex-col rounded-2xl bg-brand-dark px-6 py-6 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/images/brand/winston-logo-emblem-transparent.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain brightness-0 invert"
          />
          <h2 className="font-serif text-xl text-neutral-100">Membership Status</h2>
        </div>
        <div className="flex items-center gap-2">
          {membership.isExpired && (
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-red-300">
              Expired
            </span>
          )}
          <span className="rounded-full bg-accent-primary px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-light">
            {membership.tierName}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm text-accent-light/80">
        {formatCentavos(membership.activationCentavos)} activation +{' '}
        {formatCentavos(membership.creditCentavos)} F&amp;B credit
      </p>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="flex flex-1 flex-col">
          <div className="border-t border-brand-light/15 pt-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-accent-light/70">Remaining credit</span>
              <span className="text-lg font-medium text-neutral-100">
                {formatCentavos(membership.remainingCreditCentavos)} of{' '}
                {formatCentavos(membership.creditCentavos)}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-brand-light/20">
              <div className="h-full rounded bg-accent-primary" style={{ width: `${creditPct}%` }} />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-brand-light/15 pt-3">
            <span className="text-accent-light/70">Expires</span>
            <span className="font-medium text-neutral-100">{membership.expiryDateLabel}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-brand-light/15 pt-4">
            {PERKS.map((perk) => (
              <span key={perk} className="flex items-center gap-1.5 text-xs text-accent-light/90">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-accent-primary">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {perk}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 md:shrink-0">
          <div className="rounded-xl bg-brand-light p-3">
            <img
              src={currentQrDataUrl}
              alt="QR code for member check-in at the front desk"
              width={140}
              height={140}
              className="h-[140px] w-[140px]"
            />
          </div>
          <p className="max-w-[160px] text-center text-xs text-accent-light/70">
            Show this code at the front desk for check-in.
          </p>
          <p className="text-xs font-medium tracking-[0.15em] text-accent-light/90">
            Check-in code: {currentCheckInCode}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="text-xs font-medium text-accent-primary underline underline-offset-2 transition-colors hover:text-accent-dark"
            >
              View Full Screen
            </button>
            <button
              type="button"
              onClick={() => setRegenerateModalOpen(true)}
              className="text-xs font-medium text-accent-light/70 underline underline-offset-2 transition-colors hover:text-accent-light"
            >
              Regenerate Code
            </button>
          </div>
        </div>
      </div>

      {membership.isExpired && (
        <Link
          href="/account/renew"
          className="mt-6 flex flex-col items-center gap-1.5 rounded-none bg-accent-primary px-6 py-2.5 text-center text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark"
        >
          Renew Membership
        </Link>
      )}

      <Link
        href="/book"
        className={`flex flex-col items-center gap-1.5 rounded-none bg-accent-primary px-6 py-2.5 text-center text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark ${membership.isExpired ? 'mt-3' : 'mt-6'}`}
      >
        Book a Court
        <span className="text-xs font-normal normal-case tracking-normal text-brand-light/70">
          Member pricing applied automatically.
        </span>
      </Link>

      <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Member QR Code">
        <div className="flex flex-col items-center gap-3">
          <img
            src={currentQrDataUrl}
            alt="QR code for member check-in at the front desk"
            width={300}
            height={300}
            className="h-[300px] w-[300px]"
          />
          <p className="max-w-[240px] text-center text-xs text-brand-dark/60">
            Show this code at the front desk for check-in.
          </p>
          <p className="text-sm font-medium tracking-[0.15em] text-brand-dark/80">
            Check-in code: {currentCheckInCode}
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={regenerateModalOpen}
        onClose={() => {
          setRegenerateModalOpen(false)
          setRegenerateError(null)
        }}
        title="Regenerate QR Code"
      >
        <p className="text-sm text-brand-dark/70">
          Your current QR code will stop working immediately. Continue?
        </p>
        {regenerateError && <p className="mt-2 text-sm text-red-600">{regenerateError}</p>}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setRegenerateModalOpen(false)
              setRegenerateError(null)
            }}
            disabled={isPending}
            className="rounded-lg border border-brand-dark/15 px-3 py-1.5 text-sm font-medium text-brand-dark/70 hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRegenerateConfirm}
            disabled={isPending}
            className="rounded-lg bg-accent-primary px-4 py-1.5 text-sm font-semibold text-brand-light hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Regenerating…' : 'Regenerate'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
