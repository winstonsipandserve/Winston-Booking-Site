import DashboardStatCard, { type StatTone } from '@/components/admin/DashboardStatCard'
import {
  BookingsIcon,
  RevenueIcon,
  TrendingIcon,
  UserIcon,
  MembershipsIcon,
  ResourcesIcon,
} from '@/components/admin/AdminIcons'
import { formatCentavos } from '@/lib/format'
import type { DashboardStats as DashboardStatsData } from '@/lib/dashboard-data'

// Month-over-month context for a revenue figure. Percentages are meaningless against a zero
// baseline, so those cases get words instead of a number.
function revenueDelta(current: number, previous: number): { note: string; tone: StatTone } {
  if (previous === 0 && current === 0) return { note: 'No revenue last month either', tone: 'neutral' }
  if (previous === 0) return { note: 'First revenue this month', tone: 'positive' }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return { note: 'Level with last month', tone: 'neutral' }
  const sign = pct > 0 ? '▲' : '▼'
  return {
    note: `${sign} ${Math.abs(pct)}% vs last month (${formatCentavos(previous)})`,
    tone: pct > 0 ? 'positive' : 'negative',
  }
}

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export default function DashboardStats({ stats }: { stats: DashboardStatsData }) {
  const bookingDelta = revenueDelta(stats.bookingRevenueThisMonthCentavos, stats.bookingRevenueLastMonthCentavos)
  const membershipDelta = revenueDelta(
    stats.membershipRevenueThisMonthCentavos,
    stats.membershipRevenueLastMonthCentavos,
  )

  const pendingNote =
    stats.pendingApplications === 0
      ? 'Nothing waiting for review'
      : stats.oldestPendingDays === null || stats.oldestPendingDays === 0
        ? 'Newest arrived today'
        : `Oldest waiting ${plural(stats.oldestPendingDays, 'day')}`
  const pendingTone: StatTone =
    stats.pendingApplications > 0 && (stats.oldestPendingDays ?? 0) >= 3 ? 'attention' : 'neutral'

  const expiringNote =
    stats.membershipsExpiringSoon > 0
      ? `${stats.membershipsExpiringSoon} expiring within 30 days`
      : 'None expiring within 30 days'

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      <DashboardStatCard
        icon={<BookingsIcon className="h-5 w-5" />}
        label="Bookings today"
        value={String(stats.bookingsToday)}
        note={`${plural(stats.bookingsThisWeek, 'confirmed booking')} this week`}
        href="/admin/bookings?status=confirmed"
      />
      <DashboardStatCard
        icon={<RevenueIcon className="h-5 w-5" />}
        label="Booking revenue this month"
        value={formatCentavos(stats.bookingRevenueThisMonthCentavos)}
        note={bookingDelta.note}
        noteTone={bookingDelta.tone}
        href="/admin/bookings?status=confirmed"
      />
      <DashboardStatCard
        icon={<TrendingIcon className="h-5 w-5" />}
        label="Membership revenue this month"
        value={formatCentavos(stats.membershipRevenueThisMonthCentavos)}
        note={membershipDelta.note}
        noteTone={membershipDelta.tone}
        href="/admin/memberships?status=active"
      />
      <DashboardStatCard
        icon={<UserIcon className="h-5 w-5" />}
        label="Pending applications"
        value={String(stats.pendingApplications)}
        note={pendingNote}
        noteTone={pendingTone}
        href="/admin/memberships?status=pending"
      />
      <DashboardStatCard
        icon={<MembershipsIcon className="h-5 w-5" />}
        label="Active members"
        value={String(stats.activeMemberships)}
        note={expiringNote}
        noteTone={stats.membershipsExpiringSoon > 0 ? 'attention' : 'neutral'}
        href="/admin/memberships?status=active"
      />
      <DashboardStatCard
        icon={<ResourcesIcon className="h-5 w-5" />}
        label="Utilization this week"
        value={`${stats.resourceUtilizationPct}%`}
        note={`${stats.bookedHoursThisWeek} hrs booked this week`}
        href="/admin/resources"
      />
    </div>
  )
}
