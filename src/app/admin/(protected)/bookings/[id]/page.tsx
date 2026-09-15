import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { prisma } from '@/lib/prisma'
import { formatBookingDateTime, formatCentavos, formatManilaTimeRange } from '@/lib/format'
import { bookingGrandTotalCentavos } from '@/lib/booking-pricing'
import RescheduleSection from '@/components/admin/RescheduleSection'
import { BookingStatusPill } from '@/components/admin/StatusPill'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-0 dark:border-gray-800">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  )
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'paymongo':
      return 'PayMongo'
    case 'membership_credit':
      return 'Member credit'
    case 'manual_online':
      return 'Manual online payment'
    default:
      return capitalize(method)
  }
}

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      resource: { include: { resourceType: true } },
      customer: true,
      addOns: { include: { addOnService: true, addOnPricingRule: true } },
      payment: true,
      reschedules: { include: { performedBy: true }, orderBy: { createdAt: 'asc' } },
    },
    relationLoadStrategy: 'query',
  })

  if (!booking) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <AdminPageHeader
        backHref="/admin/bookings"
        backLabel="Back to bookings"
        title={`${booking.resource.resourceType.name} — ${booking.resource.label}`}
        subtitle={formatManilaTimeRange(booking.startTime, booking.endTime)}
        recordId={booking.id}
        aside={<BookingStatusPill status={booking.status} />}
      />

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Details</h2>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Start</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">
              {formatBookingDateTime(booking.startTime)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">End</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">
              {formatBookingDateTime(booking.endTime)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Submitted</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">
              {formatBookingDateTime(booking.createdAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Guest count</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">{booking.guestCount}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-2 text-sm last:border-0">
            <span className="text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">
              {formatCentavos(bookingGrandTotalCentavos(booking))}
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Customer</h2>
          {booking.customer ? (
            <>
              <DetailRow label="Name" value={booking.customerNameSnapshot ?? '—'} />
              <DetailRow label="Email" value={booking.customer.email} />
              <DetailRow label="Phone" value={booking.customerPhoneSnapshot ?? '—'} />
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No customer attached yet.</p>
          )}
        </section>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {booking.addOns.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Add-ons</h2>
            {booking.addOns.map((addOn) => (
              <DetailRow
                key={addOn.id}
                label={
                  addOn.addOnService.name +
                  (addOn.addOnPricingRule.paxCount ? ` (${addOn.addOnPricingRule.paxCount} Pax)` : '')
                }
                value={formatCentavos(addOn.amountCentavos)}
              />
            ))}
          </section>
        )}

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Payment</h2>
          {booking.payment ? (
            <>
              <DetailRow label="Status" value={capitalize(booking.payment.status)} />
              <DetailRow label="Payment Method" value={paymentMethodLabel(booking.payment.method)} />
              {booking.payment.method === 'membership_credit' && (
                <DetailRow
                  label="Member Credit Deducted"
                  value={formatCentavos(booking.payment.amountCentavos)}
                />
              )}
              <DetailRow
                label="Paid At"
                value={
                  booking.payment.paidAt
                    ? formatBookingDateTime(booking.payment.paidAt)
                    : '—'
                }
              />
              <DetailRow label="PayMongo Payment ID" value={booking.payment.paymongoPaymentId ?? '—'} />
              <DetailRow
                label="PayMongo Fee"
                value={
                  booking.payment.paymongoFeeCentavos != null
                    ? `-${formatCentavos(booking.payment.paymongoFeeCentavos)}`
                    : '—'
                }
              />
              <DetailRow
                label="Net Amount"
                value={
                  booking.payment.paymongoNetAmountCentavos != null
                    ? formatCentavos(booking.payment.paymongoNetAmountCentavos)
                    : '—'
                }
              />
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No payment record.</p>
          )}
        </section>
      </div>

      <div className="mb-6 grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="h-full rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Reschedule History</h2>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {booking.reschedules.length} {booking.reschedules.length === 1 ? 'change' : 'changes'}
            </span>
          </div>
          {booking.reschedules.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    Original slot
                  </th>
                  <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    New slot
                  </th>
                  <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    Reason
                  </th>
                  <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    Performed by
                  </th>
                  <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {booking.reschedules.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                      {formatManilaTimeRange(r.originalStart, r.originalEnd)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                      {formatManilaTimeRange(r.newStart, r.newEnd)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{r.reason}</td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{r.performedBy.name}</td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                      {formatBookingDateTime(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/70 px-4 py-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">No reschedules yet.</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Changes to this booking will appear here.</p>
            </div>
          )}
        </section>

        {booking.status === 'confirmed' && (
          <RescheduleSection
            bookingId={booking.id}
            durationMinutes={(booking.endTime.getTime() - booking.startTime.getTime()) / 60_000}
          />
        )}
      </div>
    </div>
  )
}
