interface StatsBarProps {
  totalResources: number
  sportCount: number
}

export default function StatsBar({ totalResources, sportCount }: StatsBarProps) {
  const stats = [
    { label: 'Courts & Simulators', value: `${totalResources}` },
    { label: 'Sports Available', value: `${sportCount}` },
    { label: 'Time Slots / Day', value: '17' },
    { label: 'Premium Grade', value: '100%' },
  ]

  return (
    <section className="bg-brand-dark">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-white/70">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
