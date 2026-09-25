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
  memberDiscountCentavos: number
  birthdayPerkApplied: boolean
  guestFeeAmountCentavos: number
  guestPassesUsed: number
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
  const coachingAddOn = booking.addOns.find((a) => a.service === 'coaching_fee')
  // totalAmountCentavos already has the member discount taken off; show the rate before it.
  const baseAmountCentavos =
    booking.totalAmountCentavos - booking.guestFeeAmountCentavos + booking.memberDiscountCentavos
  const hasAddOnsBreakdown = booking.guestCount > 0 || booking.addOns.length > 0
  // The Price row alone is the total only when nothing else moved it.
  const showTotal = hasAddOnsBreakdown || booking.memberDiscountCentavos > 0

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Booking confirmed</h2>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white px-6 py-6 shadow-sm">
        <h3 className="mb-4 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Booking Details
        </h3>
        <dl className="flex flex-col">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-gray-500">Booking Reference</dt>
            <dd className="text-right text-sm font-medium text-gray-900">
              {booking.id}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-200 py-3">
            <dt className="text-gray-500">Resource</dt>
            <dd className="text-right font-medium text-gray-900">
              {booking.resource.typeName} — {booking.resource.label}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-200 py-3">
            <dt className="text-gray-500">Date &amp; time</dt>
            <dd className="text-right font-medium text-gray-900">
              {start.toLocaleString('en-PH')}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-200 py-3">
            <dt className="text-gray-500">Duration</dt>
            <dd className="text-right font-medium text-gray-900">{durationMinutes} minutes</dd>
          </div>
          {booking.guestCount > 0 && (
            <div className="flex justify-between gap-4 border-t border-gray-200 py-3">
              <dt className="text-gray-500">Non-member guests</dt>
              <dd className="text-right font-medium text-gray-900">{booking.guestCount}</dd>
            </div>
          )}
          {coachingAddOn && (
            <div className="flex justify-between gap-4 border-t border-gray-200 py-3">
              <dt className="text-gray-500">
                Coaching{coachingAddOn.paxCount !== null && ` — ${coachingAddOn.paxCount} Pax`}
              </dt>
              <dd className="text-right font-medium text-gray-900">Yes</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white px-6 py-6 shadow-sm">
        <h3 className="mb-4 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Payment Summary
        </h3>
        <dl className="flex flex-col">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-gray-500">Price</dt>
            <dd className="text-right font-medium text-gray-900">
              {formatCentavos(baseAmountCentavos)}
            </dd>
          </div>
          {booking.memberDiscountCentavos > 0 && (
            <div className="flex justify-between gap-4 border-t border-gray-200 py-3">
              <dt className="text-gray-500">{booking.birthdayPerkApplied ? 'Birthday court hour' : 'Member discount'}</dt>
              <dd className="text-right font-medium text-gray-900">
                &minus;{formatCentavos(booking.memberDiscountCentavos)}
              </dd>
            </div>
          )}
          {hasAddOnsBreakdown && (
            <>
              <div className="border-t border-gray-200 py-3">
                <dt className="text-gray-500">Add-ons total</dt>
              </div>
              <div className="flex flex-col gap-2 border-t border-gray-200 py-3 pl-4">
                {booking.guestCount > 0 && (
                  <div className="flex justify-between gap-4 text-sm">
                    <dt className="text-gray-500">
                      Non-member guests — {booking.guestCount} Pax
                      {booking.guestPassesUsed > 0 &&
                        ` (${booking.guestPassesUsed} guest pass${booking.guestPassesUsed === 1 ? '' : 'es'})`}
                    </dt>
                    <dd className="text-right font-medium text-gray-900">
                      {formatCentavos(booking.guestFeeAmountCentavos)}
                    </dd>
                  </div>
                )}
                {coachingAddOn && (
                  <div className="flex justify-between gap-4 text-sm">
                    <dt className="text-gray-500">
                      Coaching{coachingAddOn.paxCount !== null && ` — ${coachingAddOn.paxCount} Pax`}
                    </dt>
                    <dd className="text-right font-medium text-gray-900">
                      {formatCentavos(coachingAddOn.amountCentavos)}
                    </dd>
                  </div>
                )}
              </div>
            </>
          )}
          {showTotal && (
            <div className="flex items-baseline justify-between gap-4 border-t border-gray-200 pt-4 mt-1">
              <dt className="text-gray-900">Total</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {formatCentavos(booking.totalAmountCentavos + booking.addOnsTotalCentavos)}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <p className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        Thanks, {booking.customer.name}! Your payment is confirmed and your slot is booked.
      </p>

      <Link
        href="/"
        className="rounded-md bg-gray-900 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
      >
        Back to Home
      </Link>
    </div>
  )
}
