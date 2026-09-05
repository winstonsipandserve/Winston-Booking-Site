import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCentavos } from '@/lib/format'
import RescheduleForm from '@/components/admin/RescheduleForm'

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
    <div className="relative isolate flex flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 hidden -z-10 dark:block dark:rounded-2xl dark:bg-gray-900"
      />
      <Link
        href="/admin/bookings"
        className="mb-4 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <span className="mr-1">&larr;</span>
        Back to bookings
      </Link>

      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Booking {booking.id}</h1>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Details</h2>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Resource</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">
              {booking.resource.resourceType.name} — {booking.resource.label}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Start</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">
              {booking.startTime.toLocaleString('en-PH')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">End</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">
              {booking.endTime.toLocaleString('en-PH')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Status</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">{booking.status}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Guest count</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">{booking.guestCount}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-2 text-sm last:border-0">
            <span className="text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-right font-medium text-gray-900 dark:text-gray-100">
              {formatCentavos(booking.totalAmountCentavos)}
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Customer</h2>
          {booking.customer ? (
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {booking.customer.name} — {booking.customer.email} — {booking.customer.phone}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No customer attached yet.</p>
          )}
        </section>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Add-ons</h2>
          {booking.addOns.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {booking.addOns.map((addOn) => (
                <li key={addOn.id} className="text-sm text-gray-900 dark:text-gray-100">
                  {addOn.addOnService.name}
                  {addOn.addOnPricingRule.paxCount ? ` (${addOn.addOnPricingRule.paxCount} pax)` : ''} —{' '}
                  {formatCentavos(addOn.amountCentavos)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No add-ons.</p>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Payment</h2>
          {booking.payment ? (
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {booking.payment.status} — {formatCentavos(booking.payment.amountCentavos)}
              {booking.payment.paidAt ? ` — paid ${booking.payment.paidAt.toLocaleString('en-PH')}` : ''}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No payment record.</p>
          )}
        </section>
      </div>

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Reschedule history</h2>
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
                      {r.originalStart.toLocaleString('en-PH')} &ndash; {r.originalEnd.toLocaleString('en-PH')}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                      {r.newStart.toLocaleString('en-PH')} &ndash; {r.newEnd.toLocaleString('en-PH')}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{r.reason}</td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{r.performedBy.name}</td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                      {r.createdAt.toLocaleString('en-PH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No reschedules yet.</p>
        )}
      </section>

      {booking.status === 'confirmed' && <RescheduleForm bookingId={booking.id} />}
    </div>
  )
}
