import { Suspense } from 'react'
import DashboardStats from '@/components/admin/DashboardStats'
import DashboardCharts from '@/components/admin/DashboardCharts'
import DashboardActivity from '@/components/admin/DashboardActivity'
import DashboardSkeleton from '@/components/admin/DashboardSkeleton'
import { getDashboardData } from '@/lib/dashboard-data'

// The dashboard is the slowest admin query and the only page whose shape (stat cards, chart,
// calendar) doesn't match the shared table skeleton, so it streams behind its own fallback.
export default function AdminPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  )
}

async function DashboardContent() {
  const data = await getDashboardData()

  return (
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
  )
}
