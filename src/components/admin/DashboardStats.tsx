import DashboardStatCard from '@/components/admin/DashboardStatCard'
import {
  BookingsIcon,
  RevenueIcon,
  MembershipsIcon,
  ResourcesIcon,
} from '@/components/admin/AdminIcons'
import { formatCentavos } from '@/lib/format'
import { DASHBOARD_STATS } from '@/lib/dashboard-mock-data'

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <DashboardStatCard
        icon={<BookingsIcon className="h-5 w-5" />}
        label="Bookings Today"
        value={String(DASHBOARD_STATS.bookingsToday)}
      />
      <DashboardStatCard
        icon={<RevenueIcon className="h-5 w-5" />}
        label="Revenue This Month"
        value={formatCentavos(DASHBOARD_STATS.revenueThisMonthCentavos)}
      />
      <DashboardStatCard
        icon={<MembershipsIcon className="h-5 w-5" />}
        label="Pending Applications"
        value={String(DASHBOARD_STATS.pendingApplications)}
      />
      <DashboardStatCard
        icon={<MembershipsIcon className="h-5 w-5" />}
        label="Active Memberships"
        value={String(DASHBOARD_STATS.activeMemberships)}
      />
      <DashboardStatCard
        icon={<ResourcesIcon className="h-5 w-5" />}
        label="Resource Utilization"
        value={`${DASHBOARD_STATS.resourceUtilizationPct}%`}
      />
    </div>
  )
}
