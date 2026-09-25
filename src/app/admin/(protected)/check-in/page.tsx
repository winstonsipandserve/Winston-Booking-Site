import CheckInTabs from '@/components/admin/CheckInTabs'

export default function AdminCheckInPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <CheckInTabs />
      </div>
    </div>
  )
}
