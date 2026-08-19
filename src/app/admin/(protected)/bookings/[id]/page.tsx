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
    <div>
      <p>
        <Link href="/admin/bookings">&larr; Back to bookings</Link>
      </p>
      <h1>Booking {booking.id}</h1>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Details</h2>
        <table cellPadding={4}>
          <tbody>
            <tr>
              <td>Resource</td>
              <td>
                {booking.resource.resourceType.name} — {booking.resource.label}
              </td>
            </tr>
            <tr>
              <td>Start</td>
              <td>{booking.startTime.toLocaleString('en-PH')}</td>
            </tr>
            <tr>
              <td>End</td>
              <td>{booking.endTime.toLocaleString('en-PH')}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>{booking.status}</td>
            </tr>
            <tr>
              <td>Guest count</td>
              <td>{booking.guestCount}</td>
            </tr>
            <tr>
              <td>Total</td>
              <td>{formatCentavos(booking.totalAmountCentavos)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Customer</h2>
        {booking.customer ? (
          <p>
            {booking.customer.name} — {booking.customer.email} — {booking.customer.phone}
          </p>
        ) : (
          <p>No customer attached yet.</p>
        )}
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Add-ons</h2>
        {booking.addOns.length > 0 ? (
          <ul>
            {booking.addOns.map((addOn) => (
              <li key={addOn.id}>
                {addOn.addOnService.name}
                {addOn.addOnPricingRule.paxCount ? ` (${addOn.addOnPricingRule.paxCount} pax)` : ''} —{' '}
                {formatCentavos(addOn.amountCentavos)}
              </li>
            ))}
          </ul>
        ) : (
          <p>No add-ons.</p>
        )}
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Payment</h2>
        {booking.payment ? (
          <p>
            {booking.payment.status} — {formatCentavos(booking.payment.amountCentavos)}
            {booking.payment.paidAt ? ` — paid ${booking.payment.paidAt.toLocaleString('en-PH')}` : ''}
          </p>
        ) : (
          <p>No payment record.</p>
        )}
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Reschedule history</h2>
        {booking.reschedules.length > 0 ? (
          <table border={1} cellPadding={6} style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Original slot</th>
                <th>New slot</th>
                <th>Reason</th>
                <th>Performed by</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {booking.reschedules.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.originalStart.toLocaleString('en-PH')} &ndash; {r.originalEnd.toLocaleString('en-PH')}
                  </td>
                  <td>
                    {r.newStart.toLocaleString('en-PH')} &ndash; {r.newEnd.toLocaleString('en-PH')}
                  </td>
                  <td>{r.reason}</td>
                  <td>{r.performedBy.name}</td>
                  <td>{r.createdAt.toLocaleString('en-PH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No reschedules yet.</p>
        )}
      </section>

      {booking.status === 'confirmed' && <RescheduleForm bookingId={booking.id} />}
    </div>
  )
}
