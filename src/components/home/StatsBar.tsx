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
    <div
      id="stats-bar"
      className="relative z-20 mx-auto -mt-16 -mb-16 w-full max-w-5xl px-6 md:-mt-20 md:-mb-20"
    >
      <div className="grid grid-cols-2 gap-y-8 rounded-2xl bg-brand-light px-8 py-10 shadow-xl shadow-brand-dark/10 sm:grid-cols-4 sm:gap-y-0">
        {stats.map((stat) => (
          <div key={stat.label} className="relative text-center sm:px-4">
            <p className="font-serif text-3xl text-brand-dark md:text-4xl">{stat.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-neutral-700/80 md:text-sm">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
