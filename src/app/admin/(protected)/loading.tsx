// Route-level skeleton for every admin section. Mirrors the shared list layout (toolbar row,
// white table card, pagination row) so the frame lands before the server query resolves.
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex h-full flex-col gap-4 motion-safe:animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 rounded-lg bg-gray-300/70 dark:bg-gray-800" />
          <div className="h-8 w-16 rounded-lg bg-gray-300/70 dark:bg-gray-800" />
        </div>
        <div className="h-8 w-64 rounded-lg bg-gray-300/70 dark:bg-gray-800" />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <div className="h-3.5 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-gray-100 px-4 py-3.5 last:border-b-0 dark:border-gray-800">
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="ml-auto h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3">
        <div className="h-4 w-20 rounded bg-gray-300/70 dark:bg-gray-800" />
        <div className="h-8 w-20 rounded-lg bg-gray-300/70 dark:bg-gray-800" />
        <div className="h-8 w-14 rounded-lg bg-gray-300/70 dark:bg-gray-800" />
      </div>
    </div>
  )
}
