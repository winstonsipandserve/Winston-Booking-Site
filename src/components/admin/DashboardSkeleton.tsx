// Dashboard-shaped placeholder: six stat cards, the chart + calendar pair, then the two
// activity lists. Mirrors DashboardStats / DashboardCharts / DashboardActivity so the page
// doesn't morph from a table into cards when the data lands.
const CARD = 'rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
const BAR = 'rounded bg-gray-200 dark:bg-gray-800'

export default function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="flex flex-col gap-6 motion-safe:animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${CARD} p-5`}>
            <div className={`h-3.5 w-32 ${BAR}`} />
            <div className={`mt-4 h-7 w-24 ${BAR}`} />
            <div className={`mt-3 h-3 w-40 ${BAR}`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${CARD} p-4`}>
          <div className="flex items-center justify-between gap-3">
            <div className={`h-4 w-40 ${BAR}`} />
            <div className={`h-7 w-48 rounded-lg ${BAR}`} />
          </div>
          <div className={`mt-6 h-56 w-full ${BAR}`} />
        </div>
        <div className={`${CARD} p-4`}>
          <div className={`h-4 w-36 ${BAR}`} />
          <div className="mt-6 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className={`h-8 ${BAR}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={`${CARD} p-5`}>
            <div className={`h-4 w-40 ${BAR}`} />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className={`h-10 w-full ${BAR}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
