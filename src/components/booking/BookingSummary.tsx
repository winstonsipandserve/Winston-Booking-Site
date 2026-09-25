import { RateTier } from '@prisma/client'
import { formatCentavos } from '@/lib/format'
import { LocationIcon, CalendarIcon, ClockIcon, GuestsIcon, CoachingIcon } from '@/components/ui/Icons'

interface BookingSummaryProps {
  resourceTypeName: string
  resourceLabel: string
  startTimeLocal: string
  durationMinutes: string
  isCourt: boolean
  guestCount: number
  coaching: boolean
  coachingPaxCount: number | null
  coachingPriceCentavos: number | null
  estimateCentavos: number | null
  /** Tier discount already taken off inside estimateCentavos; 0 for non-members. */
  discountEstimateCentavos: number
  /** e.g. "Member discount — 10%" or "Birthday court hour — free". */
  discountLabel: string
  /** Guests whose fee is waived by complimentary guest passes. */
  guestPassesApplied: number
  addOnsEstimateCentavos: number
  guestFeeCentavos: number
  rateTier: RateTier
  hasSession: boolean
  showIcons?: boolean
  bookingReference?: string | null
}

function RowIcon({ icon: Icon, show }: { icon: (props: { className?: string }) => React.JSX.Element; show?: boolean }) {
  if (!show) return null
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
      <Icon className="h-4 w-4" />
    </span>
  )
}

export default function BookingSummary({
  resourceTypeName,
  resourceLabel,
  startTimeLocal,
  durationMinutes,
  isCourt,
  guestCount,
  coaching,
  coachingPaxCount,
  coachingPriceCentavos,
  estimateCentavos,
  discountEstimateCentavos,
  discountLabel,
  guestPassesApplied,
  addOnsEstimateCentavos,
  guestFeeCentavos,
  rateTier,
  hasSession,
  showIcons = false,
  bookingReference,
}: BookingSummaryProps) {
  const startDisplay = startTimeLocal ? new Date(startTimeLocal).toLocaleString('en-PH') : ''
  // Undiscounted court/simulator amount: the estimate minus the guest fee, plus the discount back.
  const chargedGuests = Math.max(0, guestCount - guestPassesApplied)
  const baseEstimateCentavos =
    estimateCentavos !== null
      ? estimateCentavos - chargedGuests * guestFeeCentavos + discountEstimateCentavos
      : null

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white px-6 py-6 shadow-sm">
      <dl className="flex flex-col">
        {bookingReference && (
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-gray-500">Booking Reference</dt>
            <dd className="text-right font-medium text-gray-900">{bookingReference}</dd>
          </div>
        )}
        <div
          className={`flex items-center justify-between gap-4 py-3 ${
            bookingReference ? 'border-t border-gray-200' : ''
          }`}
        >
          <dt className="flex items-center gap-2 text-gray-500">
            <RowIcon icon={LocationIcon} show={showIcons} />
            Sport
          </dt>
          <dd className="text-right font-medium text-gray-900">{resourceTypeName}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 py-3">
          <dt className="flex items-center gap-2 text-gray-500">
            <RowIcon icon={LocationIcon} show={showIcons} />
            Court / bay
          </dt>
          <dd className="text-right font-medium text-gray-900">{resourceLabel}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 py-3">
          <dt className="flex items-center gap-2 text-gray-500">
            <RowIcon icon={CalendarIcon} show={showIcons} />
            Date &amp; time
          </dt>
          <dd className="text-right font-medium text-gray-900">{startDisplay}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 py-3">
          <dt className="flex items-center gap-2 text-gray-500">
            <RowIcon icon={ClockIcon} show={showIcons} />
            Duration — {durationMinutes} minutes
          </dt>
          <dd className="text-right font-medium text-gray-900">
            {baseEstimateCentavos !== null ? formatCentavos(baseEstimateCentavos) : '—'}
          </dd>
        </div>
        {discountEstimateCentavos > 0 && (
          <div className="flex items-center justify-between gap-4 border-t border-gray-200 py-3">
            <dt className="flex items-center gap-2 text-gray-500">
              {discountLabel}
            </dt>
            <dd className="text-right font-medium text-gray-900">
              &minus;{formatCentavos(discountEstimateCentavos)}
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 py-3">
          <dt className="flex items-center gap-2 text-gray-500">
            <RowIcon icon={GuestsIcon} show={showIcons} />
            Non-member guests
            {guestCount > 0 && ` — ${guestCount}`}
            {guestPassesApplied > 0 &&
              ` (${guestPassesApplied} guest pass${guestPassesApplied === 1 ? '' : 'es'})`}
          </dt>
          <dd className="text-right font-medium text-gray-900">
            {guestCount > 0 ? formatCentavos(chargedGuests * guestFeeCentavos) : guestCount}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 py-3">
          <dt className="flex items-center gap-2 text-gray-500">
            <RowIcon icon={CoachingIcon} show={showIcons} />
            Coaching
            {isCourt && coachingPaxCount !== null && ` — ${coachingPaxCount} Pax`}
          </dt>
          <dd className="text-right font-medium text-gray-900">
            {coaching
              ? coachingPriceCentavos !== null
                ? formatCentavos(coachingPriceCentavos)
                : 'Selected'
              : 'Not selected'}
          </dd>
        </div>
      </dl>

      <div className="mt-2 border-t border-gray-200 pt-4">
        {estimateCentavos !== null ? (
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-gray-900">Estimated price</span>
            <span className="text-2xl font-semibold text-gray-900">
              {formatCentavos(estimateCentavos + addOnsEstimateCentavos)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No estimate available for this combination — your final price will be confirmed on
            submit.
          </p>
        )}
      </div>
    </div>
  )
}
