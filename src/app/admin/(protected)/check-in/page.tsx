import CheckInTabs from '@/components/admin/CheckInTabs'

export default function AdminCheckInPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Check-In</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-xl border border-gray-200 p-4">
        <CheckInTabs />
      </div>
    </div>
  )
}
