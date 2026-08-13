import { BUSINESS_OPEN_HOUR, BUSINESS_CLOSE_HOUR } from '@/lib/business-hours'

interface StatsBarProps {
  totalResources: number
  sportCount: number
}

function formatHour12(hour: number): string {
  if (hour === 0) return '12AM'
  if (hour === 12) return '12PM'
  if (hour < 12) return `${hour}AM`
  return `${hour - 12}PM`
}

export default function StatsBar({ totalResources, sportCount }: StatsBarProps) {
  const stats = [
    { label: 'Sports', value: `${sportCount}` },
    { label: 'Courts & Simulators', value: `${totalResources}` },
    { label: 'Opens Daily', value: formatHour12(BUSINESS_OPEN_HOUR) },
    { label: 'Last Booking', value: formatHour12(BUSINESS_CLOSE_HOUR) },
  ]

  return (
    <div className="relative z-10 mx-auto -mt-16 max-w-5xl px-6 sm:-mt-24">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-3xl bg-brand-light px-6 py-8 shadow-card sm:grid-cols-4 sm:gap-0 sm:px-4 sm:py-10">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`text-center sm:px-6 ${
              index > 0 ? 'sm:border-l sm:border-brand-mid/20' : ''
            }`}
          >
            <p className="text-3xl font-semibold text-brand-dark sm:text-4xl">{stat.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-600">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
