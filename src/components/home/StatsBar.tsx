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
    <div className="bg-brand-mid">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-brand-light/15 sm:grid-cols-4 sm:divide-y-0 md:px-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center gap-1.5 px-4 py-8 text-center md:py-10"
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
