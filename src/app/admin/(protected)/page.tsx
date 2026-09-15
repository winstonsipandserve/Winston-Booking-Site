import DashboardStats from '@/components/admin/DashboardStats'
import DashboardCharts from '@/components/admin/DashboardCharts'
import DashboardActivity from '@/components/admin/DashboardActivity'
import { getDashboardData } from '@/lib/dashboard-data'

export default async function AdminPage() {
  const data = await getDashboardData()

  return (
    <div className="relative isolate flex h-full flex-col gap-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 hidden -z-10 dark:block dark:rounded-2xl dark:bg-gray-900"
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6">
          <DashboardStats stats={data.stats} />
          <DashboardCharts
            revenueTrend={data.revenueTrend}
            membershipRevenueTrend={data.membershipRevenueTrend}
            bookingCalendar={data.bookingCalendar}
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
