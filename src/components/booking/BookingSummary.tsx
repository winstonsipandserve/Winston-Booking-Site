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
  estimateCentavos: number | null
  addOnsEstimateCentavos: number
  rateTier: RateTier
  hasSession: boolean
  showIcons?: boolean
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
  estimateCentavos,
  addOnsEstimateCentavos,
  rateTier,
  hasSession,
  showIcons = false,
}: BookingSummaryProps) {
  const startDisplay = startTimeLocal ? new Date(startTimeLocal).toLocaleString('en-PH') : ''

  return (
    <div className="flex flex-col rounded-card border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
      <dl className="flex flex-col">
        <div className="flex items-center justify-between gap-4 py-3">
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
            Duration
          </dt>
          <dd className="text-right font-medium text-brand-dark">{durationMinutes} minutes</dd>
        </div>
        {isCourt && (
          <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
            <dt className="flex items-center gap-2 text-brand-dark/70">
              <RowIcon icon={GuestsIcon} show={showIcons} />
              Guests
            </dt>
            <dd className="text-right font-medium text-brand-dark">{guestCount}</dd>
          </div>
        )}
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
          </dt>
          <dd className="text-right font-medium text-brand-dark">
            {coaching
              ? isCourt && coachingPaxCount !== null
                ? `${coachingPaxCount} Pax`
                : 'Selected'
              : 'Not selected'}
          </dd>
        </div>
      </dl>

      <div className="mt-2 border-t border-brand-dark/10 pt-4">
        {estimateCentavos !== null ? (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-serif text-brand-dark">Estimated price</span>
              <span className="text-2xl font-medium text-accent-primary">
                {formatCentavos(estimateCentavos + addOnsEstimateCentavos)}
              </span>
            </div>
            <p className="mt-1 text-sm text-brand-dark/60">
              Add-ons subtotal: {formatCentavos(addOnsEstimateCentavos)}
            </p>
            <p className="text-sm text-brand-dark/60">
              {rateTier === 'member'
                ? 'Estimated at member rate.'
                : hasSession
                  ? "Estimated at non-member rate — your membership has expired. Renew your membership to restore member rate and F&B credit."
                  : 'Estimated at non-member rate. Member rate and F&B credit are only available when signed in to a membership account.'}
            </p>
          </>
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
