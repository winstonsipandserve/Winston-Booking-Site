'use client'

import { THEME_OPTIONS, type ThemeMode } from '@/lib/admin-theme'

export default function ThemeSegmentedControl({
  mode,
  onChange,
}: {
  mode: ThemeMode
  onChange: (mode: ThemeMode) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="grid grid-cols-3 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800"
    >
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          role="radio"
          aria-checked={mode === option.key}
          onClick={() => onChange(option.key)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            mode === option.key
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
