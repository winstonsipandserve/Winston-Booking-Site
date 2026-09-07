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

interface BookingConfirmationProps {
  booking: BookingDetail
}

export default function BookingConfirmation({ booking }: BookingConfirmationProps) {
  const start = new Date(booking.startTime)
  const end = new Date(booking.endTime)
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000)
  const ballBoyAddOn = booking.addOns.find((a) => a.service === 'ball_boy')
  const coachingAddOn = booking.addOns.find((a) => a.service === 'coaching_fee')

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="font-serif text-2xl text-brand-dark">Booking confirmed</h2>
      </div>

      <div className="rounded-card border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
        <dl className="flex flex-col">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-brand-dark/70">Booking Reference</dt>
            <dd className="text-right font-mono text-sm font-medium text-brand-dark">
              {booking.id}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
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
          {ballBoyAddOn && (
            <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
              <dt className="text-brand-dark/70">Ball Boy</dt>
              <dd className="text-right font-medium text-brand-dark">Yes</dd>
            </div>
          )}
          {coachingAddOn && (
            <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
              <dt className="text-brand-dark/70">Coaching</dt>
              <dd className="text-right font-medium text-brand-dark">
                Yes{coachingAddOn.paxCount !== null && ` — ${coachingAddOn.paxCount} Pax`}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-card border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
        <dl className="flex flex-col">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-brand-dark/70">Price</dt>
            <dd className="text-right font-medium text-brand-dark">
              {formatCentavos(booking.totalAmountCentavos)}
            </dd>
          </div>
          {booking.addOns.length > 0 && (
            <>
              <div className="flex justify-between gap-4 border-t border-brand-dark/10 py-3">
                <dt className="text-brand-dark/70">Add-ons total</dt>
                <dd className="text-right font-medium text-brand-dark">
                  {formatCentavos(booking.addOnsTotalCentavos)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-brand-dark/10 pt-4 mt-1">
                <dt className="font-serif text-brand-dark">Total</dt>
                <dd className="text-2xl font-medium text-accent-primary">
                  {formatCentavos(booking.totalAmountCentavos + booking.addOnsTotalCentavos)}
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <p className="rounded-card-inline border border-brand-dark/10 bg-brand-dark/[0.03] px-4 py-3 text-sm text-brand-dark/70">
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
