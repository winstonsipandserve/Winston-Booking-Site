import DashboardStats from '@/components/admin/DashboardStats'
import DashboardCharts from '@/components/admin/DashboardCharts'
import DashboardActivity from '@/components/admin/DashboardActivity'
import { getDashboardData } from '@/lib/dashboard-data'

export default async function AdminPage() {
  const data = await getDashboardData()

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of bookings, revenue, and membership activity</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6">
          <DashboardStats stats={data.stats} />
          <DashboardCharts
            bookingsTrend={data.bookingsTrend}
            revenueTrend={data.revenueTrend}
            resourceBreakdown={data.resourceBreakdown}
          />
          <DashboardActivity
            recentBookings={data.recentBookings}
            recentApplications={data.recentApplications}
          />
        </div>
      </div>
    </div>
  )
}
