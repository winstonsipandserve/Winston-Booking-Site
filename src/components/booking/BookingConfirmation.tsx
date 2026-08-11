import { formatCentavos } from '@/lib/format'

export interface BookingAddOn {
  service: string
  paxCount: number | null
  amountCentavos: number
}

export interface BookingSuccess {
  id: string
  status: string
  resourceId: string
  startTime: string
  endTime: string
  totalAmountCentavos: number
  holdExpiresAt: string
  addOns: BookingAddOn[]
  addOnsTotalCentavos: number
}

const ADD_ON_LABELS: Record<string, string> = {
  ball_boy: 'Ball Boy',
  coaching_fee: 'Coaching',
}

interface BookingConfirmationProps {
  booking: BookingSuccess
  resourceLabel: string
  resourceTypeName: string
}

export default function BookingConfirmation({
  booking,
  resourceLabel,
  resourceTypeName,
}: BookingConfirmationProps) {
  const start = new Date(booking.startTime)
  const end = new Date(booking.endTime)
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000)

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <h2 className="text-2xl font-semibold">Booking held</h2>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Resource</dt>
          <dd>
            {resourceTypeName} — {resourceLabel}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Date &amp; time</dt>
          <dd>{start.toLocaleString('en-PH')}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Duration</dt>
          <dd>{durationMinutes} minutes</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Price</dt>
          <dd>{formatCentavos(booking.totalAmountCentavos)}</dd>
        </div>
        {booking.addOns.map((addOn, i) => (
          <div key={i} className="flex justify-between gap-4">
            <dt className="font-medium">
              {ADD_ON_LABELS[addOn.service] ?? addOn.service}
              {addOn.paxCount !== null && ` — ${addOn.paxCount} Pax`}
            </dt>
            <dd>{formatCentavos(addOn.amountCentavos)}</dd>
          </div>
        ))}
        {booking.addOns.length > 0 && (
          <>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Add-ons total</dt>
              <dd>{formatCentavos(booking.addOnsTotalCentavos)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Total</dt>
              <dd>
                {formatCentavos(booking.totalAmountCentavos + booking.addOnsTotalCentavos)}
              </dd>
            </div>
          </>
        )}
      </dl>
      <p className="rounded border border-black/[.08] bg-black/[.03] px-3 py-2 text-sm text-zinc-600 dark:border-white/[.08] dark:bg-white/[.04] dark:text-zinc-400">
        Payment isn&apos;t live yet — our team will follow up to confirm payment for this booking.
      </p>
    </div>
  )
}
