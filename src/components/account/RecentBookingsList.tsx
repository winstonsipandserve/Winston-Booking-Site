import { LocationIcon, CalendarIcon } from '@/components/ui/Icons'

// SAMPLE CONTENT — hardcoded placeholder booking history for this frontend-only pass.
// Replace once member auth (Auth.js session tied to Customer/Booking) is wired.
// Status values are real Booking enum values (confirmed/cancelled/pending_payment) only.
const SAMPLE_BOOKINGS: {
  id: string
  resourceTypeName: string
  resourceLabel: string
  dateLabel: string
  status: 'confirmed' | 'cancelled' | 'pending_payment'
}[] = [
  {
    id: 'sample-1',
    resourceTypeName: 'Tennis Court',
    resourceLabel: 'Court 1',
    dateLabel: 'Sep 5, 2026, 4:00 PM',
    status: 'confirmed',
  },
  {
    id: 'sample-2',
    resourceTypeName: 'Golf Simulator',
    resourceLabel: 'Bay 2',
    dateLabel: 'Jul 20, 2026, 10:00 AM',
    status: 'confirmed',
  },
]

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  pending_payment: 'Pending Payment',
}

export default function RecentBookingsList() {
  return (
    <div className="flex flex-col rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-6 shadow-card">
      <h2 className="font-serif text-xl text-brand-dark">Recent Bookings</h2>
      <dl className="mt-2 flex flex-col">
        {SAMPLE_BOOKINGS.map((booking, index) => (
          <div
            key={booking.id}
            className={`flex items-center justify-between gap-4 py-3 ${index > 0 ? 'border-t border-brand-dark/10' : ''}`}
          >
            <dt className="flex items-center gap-3 text-brand-dark/70">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                <LocationIcon className="h-4 w-4" />
              </span>
              <span>
                {booking.resourceTypeName} — {booking.resourceLabel}
              </span>
            </dt>
            <dd className="flex flex-col items-end text-right">
              <span className="flex items-center gap-1.5 font-medium text-brand-dark">
                <CalendarIcon className="h-3.5 w-3.5 text-brand-dark/50" />
                {booking.dateLabel}
              </span>
              <span className="mt-0.5 text-xs uppercase tracking-wide text-accent-primary">
                {STATUS_LABELS[booking.status]}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
