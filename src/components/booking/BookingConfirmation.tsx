import Link from 'next/link'
import { formatCentavos } from '@/lib/format'

export interface BookingAddOn {
  service: string
  paxCount: number | null
  amountCentavos: number
}

export interface BookingDetail {
  id: string
  status: string
  startTime: string
  endTime: string
  totalAmountCentavos: number
  addOns: BookingAddOn[]
  addOnsTotalCentavos: number
  resource: { typeName: string; label: string }
  guestCount: number
  customer: { name: string }
  payment: { status: string; amountCentavos: number; paidAt: string | null } | null
}

const ADD_ON_LABELS: Record<string, string> = {
  ball_boy: 'Ball Boy',
  coaching_fee: 'Coaching',
}

interface BookingConfirmationProps {
  booking: BookingDetail
}

export default function BookingConfirmation({ booking }: BookingConfirmationProps) {
  const start = new Date(booking.startTime)
  const end = new Date(booking.endTime)
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000)

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="font-serif text-2xl text-brand-dark">Booking confirmed</h2>
        <p className="text-sm text-brand-dark/60">
          Booking Reference:{' '}
          <span className="font-mono text-sm text-brand-dark">{booking.id}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
        <dl className="flex flex-col">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-brand-dark/70">Resource</dt>
            <dd className="text-right font-medium text-brand-dark">
              {booking.resource.typeName} — {booking.resource.label}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
            <dt className="text-brand-dark/70">Date &amp; time</dt>
            <dd className="text-right font-medium text-brand-dark">
              {start.toLocaleString('en-PH')}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
            <dt className="text-brand-dark/70">Duration</dt>
            <dd className="text-right font-medium text-brand-dark">{durationMinutes} minutes</dd>
          </div>
          {booking.guestCount > 0 && (
            <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
              <dt className="text-brand-dark/70">Guests</dt>
              <dd className="text-right font-medium text-brand-dark">{booking.guestCount}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
            <dt className="text-brand-dark/70">Price</dt>
            <dd className="text-right font-medium text-brand-dark">
              {formatCentavos(booking.totalAmountCentavos)}
            </dd>
          </div>
          {booking.addOns.map((addOn, i) => (
            <div
              key={i}
              className="flex justify-between gap-4 border-t border-brand-dark/10 py-3"
            >
              <dt className="text-brand-dark/70">
                {ADD_ON_LABELS[addOn.service] ?? addOn.service}
                {addOn.paxCount !== null && ` — ${addOn.paxCount} Pax`}
              </dt>
              <dd className="text-right font-medium text-brand-dark">
                {formatCentavos(addOn.amountCentavos)}
              </dd>
            </div>
          ))}
          {booking.addOns.length > 0 && (
            <>
              <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                <dt className="text-brand-dark/70">Add-ons total</dt>
                <dd className="text-right font-medium text-brand-dark">
                  {formatCentavos(booking.addOnsTotalCentavos)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                <dt className="text-brand-dark/70">Total</dt>
                <dd className="text-right font-medium text-brand-dark">
                  {formatCentavos(booking.totalAmountCentavos + booking.addOnsTotalCentavos)}
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <p className="rounded-xl border border-brand-dark/10 bg-brand-dark/[0.03] px-4 py-3 text-sm text-brand-dark/70">
        Thanks, {booking.customer.name}! Your payment is confirmed and your slot is booked.
      </p>

      <Link
        href="/"
        className="rounded-none bg-accent-primary px-9 py-3.5 text-center text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark"
      >
        Back to Home
      </Link>
    </div>
  )
}
