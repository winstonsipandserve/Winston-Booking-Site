'use client'

import { useId } from 'react'

// A friendlier replacement for <input type="datetime-local">: a native date picker next to
// a 12-hour time dropdown in 15-minute steps. Value stays the same `YYYY-MM-DDTHH:mm` local
// string that datetime-local produces, so callers need no changes.

const STEP_MINUTES = 15
const DEFAULT_TIME = '09:00'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function timeLabel(time: string): string {
  const [hour, minute] = time.split(':').map(Number)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12
  return `${twelveHour}:${pad(minute)} ${suffix}`
}

const TIME_OPTIONS: string[] = []
for (let minutes = 0; minutes < 24 * 60; minutes += STEP_MINUTES) {
  TIME_OPTIONS.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`)
}

function nowLocal(): string {
  const now = new Date()
  const rounded = Math.ceil(now.getMinutes() / STEP_MINUTES) * STEP_MINUTES
  now.setMinutes(rounded, 0, 0)
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export default function DateTimeField({ value, onChange, disabled = false }: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const id = useId()
  const [date = '', time = ''] = value ? value.split('T') : []
  // Keep an off-grid time (e.g. 02:57 from an existing post) selectable rather than silently moving it.
  const options = time && !TIME_OPTIONS.includes(time) ? [...TIME_OPTIONS, time].sort() : TIME_OPTIONS
  const inputClass = 'min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'

  function update(nextDate: string, nextTime: string) {
    if (!nextDate) {
      onChange('')
      return
    }
    onChange(`${nextDate}T${nextTime || DEFAULT_TIME}`)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,9rem)] gap-2">
        <input id={`${id}-date`} type="date" value={date} disabled={disabled} onChange={(event) => update(event.target.value, time)} aria-label="Date" className={inputClass} />
        <select id={`${id}-time`} value={time} disabled={disabled || !date} onChange={(event) => update(date, event.target.value)} aria-label="Time" className={inputClass}>
          {!time && <option value="">Time</option>}
          {options.map((option) => <option key={option} value={option}>{timeLabel(option)}</option>)}
        </select>
      </div>
      <div className="flex gap-3 text-xs">
        <button type="button" disabled={disabled} onClick={() => onChange(nowLocal())} className="font-medium text-gray-600 underline-offset-2 hover:underline disabled:opacity-60 dark:text-gray-300">Now</button>
        {value && <button type="button" disabled={disabled} onClick={() => onChange('')} className="font-medium text-gray-600 underline-offset-2 hover:underline disabled:opacity-60 dark:text-gray-300">Clear</button>}
      </div>
    </div>
  )
}
