import type { ReactNode } from 'react'

interface DashboardStatCardProps {
  icon: ReactNode
  label: string
  value: string
  note?: string
}

export default function DashboardStatCard({ icon, label, value, note }: DashboardStatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-gray-400">{icon}</div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
    </div>
  )
}
