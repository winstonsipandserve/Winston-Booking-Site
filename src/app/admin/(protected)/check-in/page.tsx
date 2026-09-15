import CheckInTabs from '@/components/admin/CheckInTabs'

export default function AdminCheckInPage() {
  return (
    <div className="relative isolate flex h-full flex-col gap-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 hidden -z-10 dark:block dark:rounded-2xl dark:bg-gray-900"
      />
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto overflow-x-auto rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <CheckInTabs />
      </div>
    </div>
  )
}
