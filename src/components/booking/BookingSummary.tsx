import { RateTier } from '@prisma/client'
import { formatCentavos } from '@/lib/format'
import { LocationIcon, CalendarIcon, ClockIcon, GuestsIcon, BallBoyIcon, CoachingIcon } from '@/components/ui/Icons'

interface BookingSummaryProps {
  resourceTypeName: string
  resourceLabel: string
  startTimeLocal: string
  durationMinutes: string
  isCourt: boolean
  guestCount: number
  ballBoy: boolean
  ballBoyPriceCentavos: number | null
  coaching: boolean
  coachingPaxCount: number | null
  coachingPriceCentavos: number | null
  estimateCentavos: number | null
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
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
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
  ballBoy,
  ballBoyPriceCentavos,
  coaching,
  coachingPaxCount,
  coachingPriceCentavos,
  estimateCentavos,
  addOnsEstimateCentavos,
  guestFeeCentavos,
  rateTier,
  hasSession,
  showIcons = false,
  bookingReference,
}: BookingSummaryProps) {
  const startDisplay = startTimeLocal ? new Date(startTimeLocal).toLocaleString('en-PH') : ''
  const baseEstimateCentavos =
    estimateCentavos !== null ? estimateCentavos - guestCount * guestFeeCentavos : null

  return (
    <div className="flex flex-col rounded-card border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
      <dl className="flex flex-col">
        {bookingReference && (
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-brand-dark/70">Booking Reference</dt>
            <dd className="text-right font-medium text-brand-dark">{bookingReference}</dd>
          </div>
        )}
        <div
          className={`flex items-center justify-between gap-4 py-3 ${
            bookingReference ? 'border-t border-brand-dark/10' : ''
          }`}
        >
          <dt className="flex items-center gap-2 text-brand-dark/70">
            <RowIcon icon={LocationIcon} show={showIcons} />
            Sport
          </dt>
          <dd className="text-right font-medium text-brand-dark">{resourceTypeName}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
          <dt className="flex items-center gap-2 text-brand-dark/70">
            <RowIcon icon={LocationIcon} show={showIcons} />
            Court / bay
          </dt>
          <dd className="text-right font-medium text-brand-dark">{resourceLabel}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
          <dt className="flex items-center gap-2 text-brand-dark/70">
            <RowIcon icon={CalendarIcon} show={showIcons} />
            Date &amp; time
          </dt>
          <dd className="text-right font-medium text-brand-dark">{startDisplay}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
          <dt className="flex items-center gap-2 text-brand-dark/70">
            <RowIcon icon={ClockIcon} show={showIcons} />
            Duration — {durationMinutes} minutes
          </dt>
          <dd className="text-right font-medium text-brand-dark">
            {baseEstimateCentavos !== null ? formatCentavos(baseEstimateCentavos) : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
          <dt className="flex items-center gap-2 text-brand-dark/70">
            <RowIcon icon={GuestsIcon} show={showIcons} />
            Guests
            {guestCount > 0 && ` — ${guestCount}`}
          </dt>
          <dd className="text-right font-medium text-brand-dark">
            {guestCount > 0 ? formatCentavos(guestCount * guestFeeCentavos) : guestCount}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
          <dt className="flex items-center gap-2 text-brand-dark/70">
            <RowIcon icon={BallBoyIcon} show={showIcons} />
            Ball Boy
          </dt>
          <dd className="text-right font-medium text-brand-dark">
            {ballBoy
              ? ballBoyPriceCentavos !== null
                ? formatCentavos(ballBoyPriceCentavos)
                : 'Selected'
              : 'Not selected'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
          <dt className="flex items-center gap-2 text-brand-dark/70">
            <RowIcon icon={CoachingIcon} show={showIcons} />
            Coaching
            {isCourt && coachingPaxCount !== null && ` — ${coachingPaxCount} Pax`}
          </dt>
          <dd className="text-right font-medium text-brand-dark">
            {coaching
              ? coachingPriceCentavos !== null
                ? formatCentavos(coachingPriceCentavos)
                : 'Selected'
              : 'Not selected'}
          </dd>
        </div>
      </dl>

      <div className="mt-2 border-t border-brand-dark/10 pt-4">
        {estimateCentavos !== null ? (
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-serif text-brand-dark">Estimated price</span>
            <span className="text-2xl font-medium text-accent-primary">
              {formatCentavos(estimateCentavos + addOnsEstimateCentavos)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-brand-dark/60">
            No estimate available for this combination — your final price will be confirmed on
            submit.
          </p>
        )}
      </div>
    </div>
  )
}
