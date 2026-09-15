import Link from 'next/link'
import type { ReactNode } from 'react'

export type StatTone = 'neutral' | 'positive' | 'negative' | 'attention'

interface DashboardStatCardProps {
  icon: ReactNode
  label: string
  value: string
  /** One line of context under the value — a delta, a countdown, a denominator. */
  note?: string
  noteTone?: StatTone
  /** When set the whole card links to the list that explains the number. */
  href?: string
}

const NOTE_TONE_CLASSES: Record<StatTone, string> = {
  neutral: 'text-gray-500 dark:text-gray-400',
  positive: 'text-emerald-700 dark:text-emerald-400',
  negative: 'text-red-600 dark:text-red-400',
  attention: 'text-amber-700 dark:text-amber-400',
}

export default function DashboardStatCard({ icon, label, value, note, noteTone = 'neutral', href }: DashboardStatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <span className="shrink-0 text-gray-400 dark:text-gray-500">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 tabular-nums dark:text-gray-100">{value}</p>
      {note && <p className={`mt-1 truncate text-xs ${NOTE_TONE_CLASSES[noteTone]}`}>{note}</p>}
    </>
  )

  const surface = 'block rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900'

  if (!href) return <div className={surface}>{body}</div>

  return (
    <Link
      href={href}
      className={`${surface} transition-colors hover:border-gray-300 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800/60`}
    >
      {body}
    </Link>
  )
}
