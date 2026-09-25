'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { formatCentavos } from '@/lib/format'
import { CheckIcon } from '@/components/ui/Icons'
import Modal from '@/components/ui/Modal'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import MembershipTopUpButtons from '@/components/account/MembershipTopUpButtons'

// System-enforced perks come from the tier (docs/business.md → Membership); the rest is
// honoured at the venue and listed on /membership.
function tierPerks(membership: {
  advanceBookingDays: number
  guestPasses: number
  bookingDiscountPercent: number
}): string[] {
  return [
    `${membership.advanceBookingDays}-day advance booking`,
    `${membership.guestPasses} guest passes / year`,
    `${membership.bookingDiscountPercent}% off bookings`,
    '10% off Sip & Serve',
  ]
}

type MembershipStatusCardProps =
  | {
      membership: null
      customerId: string
    }
  | {
      membership: {
        tierName: string
        isFounding: boolean
        bookingDiscountPercent: number
        guestPasses: number
        advanceBookingDays: number
        /** Complimentary guest passes left this term. */
        guestPassesRemaining: number
        /** Birthday-month court hour: which month, and whether this term has used it. */
        birthdayMonthLabel: string | null
        birthdayPerkUsed: boolean
        remainingCreditCentavos: number
        expiryDateLabel: string
        isExpired: boolean
        /** Expired, or the current term ends within the renewal window and nothing is scheduled yet. */
        canRenew: boolean
        /** Set when a renewal has already been paid for and queued behind the current term. */
        scheduledRenewalExpiryLabel: string | null
      }
      customerId: string
      qrCodeDataUrl: string
      checkInCode: string
    }

export default function MembershipStatusCard(props: MembershipStatusCardProps) {
  const { membership } = props
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false)
  const [topUpModalOpen, setTopUpModalOpen] = useState(false)
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
      <div className="flex flex-col rounded-lg border border-gray-200 bg-white px-6 py-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Membership Status</h2>
        <p className="mt-4 text-sm text-gray-500">No active membership on file.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white px-6 py-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Membership Status</h2>
        <div className="flex items-center gap-2">
          {membership.isExpired && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              Expired
            </span>
          )}
          <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
            {membership.tierName}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-500">
        {membership.isFounding
          ? 'Founding Member — thank you for being one of our first 100 Premier members.'
          : 'Annual membership.'}
      </p>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="flex flex-1 flex-col">
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-gray-500">Booking Credit</span>
              <span className="text-lg font-medium text-gray-900">
                {formatCentavos(membership.remainingCreditCentavos)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-200 pt-3">
            <span className="text-gray-500">Expires</span>
            <span className="font-medium text-gray-900">{membership.expiryDateLabel}</span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-200 pt-3">
            <span className="text-gray-500">Guest passes</span>
            <span className="font-medium text-gray-900">
              {membership.guestPassesRemaining} of {membership.guestPasses} left
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-200 pt-3">
            <span className="text-gray-500">Birthday court hour</span>
            <span className="font-medium text-gray-900">
              {membership.birthdayMonthLabel === null
                ? 'Add your birthday to unlock'
                : membership.birthdayPerkUsed
                  ? 'Used this term'
                  : `Available in ${membership.birthdayMonthLabel}`}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-200 pt-4">
            {tierPerks(membership).map((perk) => (
              <span key={perk} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-gray-500">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {perk}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 md:shrink-0">
          <div className="rounded-lg border border-gray-200 p-3">
            <img
              src={currentQrDataUrl}
              alt="QR code for member check-in at the front desk"
              width={140}
              height={140}
              className="h-[140px] w-[140px]"
            />
          </div>
          <p className="max-w-[160px] text-center text-xs text-gray-500">
            Show this code at the front desk for check-in.
          </p>
          <p className="text-xs font-medium tracking-[0.15em] text-gray-700">
            Check-in code: {currentCheckInCode}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="text-xs font-medium text-gray-900 underline underline-offset-2 transition-colors hover:text-gray-700"
            >
              View Full Screen
            </button>
            <button
              type="button"
              onClick={() => setRegenerateModalOpen(true)}
              className="text-xs font-medium text-gray-500 underline underline-offset-2 transition-colors hover:text-gray-700"
            >
              Regenerate Code
            </button>
          </div>
        </div>
      </div>

      {membership.scheduledRenewalExpiryLabel && (
        <p className="mt-6 border-l-4 border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          Your renewal is paid and starts automatically when this term ends. It runs through{' '}
          <span className="font-medium text-gray-900">{membership.scheduledRenewalExpiryLabel}</span>.
        </p>
      )}

      {membership.isExpired && (
        <>
          <Link
            href="/account/renew"
            className="mt-6 flex items-center justify-center rounded-md bg-gray-900 px-6 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            Renew Membership
          </Link>
          <Link
            href="/book"
            className="mt-3 flex items-center justify-center rounded-md bg-gray-900 px-6 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            Book a Court
          </Link>
        </>
      )}

      {!membership.isExpired && (
        <div className="mt-6 flex flex-col gap-3">
          {membership.canRenew && (
            <Link
              href="/account/renew"
              className="flex items-center justify-center rounded-md bg-gray-900 px-6 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              Renew Early
            </Link>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTopUpModalOpen(true)}
              className="flex flex-1 items-center justify-center rounded-md border border-gray-300 px-6 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Top Up
            </button>
            <Link
              href="/book"
              className="flex flex-1 items-center justify-center rounded-md bg-gray-900 px-6 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              Book a Court
            </Link>
          </div>
        </div>
      )}

      <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Member QR Code">
        <div className="flex flex-col items-center gap-3">
          <img
            src={currentQrDataUrl}
            alt="QR code for member check-in at the front desk"
            width={300}
            height={300}
            className="h-[300px] w-[300px]"
          />
          <p className="max-w-[240px] text-center text-xs text-gray-500">
            Show this code at the front desk for check-in.
          </p>
          <p className="text-sm font-medium tracking-[0.15em] text-gray-700">
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
        <LoadingOverlay isOpen={isPending} label="Regenerating…" />
        <p className="text-sm text-gray-600">
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
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRegenerateConfirm}
            disabled={isPending}
            className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Regenerate
          </button>
        </div>
      </Modal>

      <Modal isOpen={topUpModalOpen} onClose={() => setTopUpModalOpen(false)} title="Top Up Booking Credit">
        {topUpModalOpen && <MembershipTopUpButtons />}
      </Modal>
    </div>
  )
}
