import DashboardStatCard from '@/components/admin/DashboardStatCard'
import {
  BookingsIcon,
  RevenueIcon,
  MembershipsIcon,
  ResourcesIcon,
} from '@/components/admin/AdminIcons'
import { formatCentavos } from '@/lib/format'
import type { DashboardStats as DashboardStatsData } from '@/lib/dashboard-data'

export default function DashboardStats({ stats }: { stats: DashboardStatsData }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <DashboardStatCard
        icon={<BookingsIcon className="h-5 w-5" />}
        label="Bookings Today"
        value={String(stats.bookingsToday)}
      />
      <DashboardStatCard
        icon={<RevenueIcon className="h-5 w-5" />}
        label="Revenue This Month"
        value={formatCentavos(stats.revenueThisMonthCentavos)}
      />
      <DashboardStatCard
        icon={<MembershipsIcon className="h-5 w-5" />}
        label="Pending Applications"
        value={String(stats.pendingApplications)}
      />
      <DashboardStatCard
        icon={<MembershipsIcon className="h-5 w-5" />}
        label="Active Memberships"
        value={String(stats.activeMemberships)}
      />
      <DashboardStatCard
        icon={<ResourcesIcon className="h-5 w-5" />}
        label="Resource Utilization"
        value={`${stats.resourceUtilizationPct}%`}
      />
    </div>
  )
}
