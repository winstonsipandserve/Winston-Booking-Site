import { BUSINESS_OPEN_HOUR, BUSINESS_CLOSE_HOUR } from '@/lib/business-hours'

// Mirrors the locked inventory in CLAUDE.md's Architecture Decisions (1 tennis court,
// 3 pickleball courts, 1 tennis simulator, 2 pickleball simulators, 2 golf simulators =
// 9 total across 3 sports). Update both places by hand if that inventory ever changes.
const TOTAL_RESOURCES = 9
const SPORT_COUNT = 3

function formatHour12(hour: number): string {
  if (hour === 0) return '12AM'
  if (hour === 12) return '12PM'
  if (hour < 12) return `${hour}AM`
  return `${hour - 12}PM`
}

export default function StatsBar() {
  const stats = [
    { label: 'Sports', value: `${SPORT_COUNT}` },
    { label: 'Courts & Simulators', value: `${TOTAL_RESOURCES}` },
    { label: 'Opens Daily', value: formatHour12(BUSINESS_OPEN_HOUR) },
    { label: 'Last Booking', value: formatHour12(BUSINESS_CLOSE_HOUR) },
  ]

  return (
    <div className="bg-brand-mid">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-brand-light/15 sm:grid-cols-4 sm:divide-y-0 md:px-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex min-h-[140px] flex-col items-center justify-center gap-1.5 px-4 py-8 text-center sm:min-h-0 md:py-10"
          >
            <p className="font-serif text-3xl text-brand-light md:text-4xl">{stat.value}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-light/60 md:text-sm">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
