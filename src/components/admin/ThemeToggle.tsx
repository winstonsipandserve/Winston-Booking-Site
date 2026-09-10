'use client'

import { useEffect, useSyncExternalStore } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'winston-admin-theme'
const THEME_CHANGE_EVENT = 'winston-admin-theme-change'

function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

function subscribeToThemePreference(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange)
  }
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', resolveIsDark(mode))
}

const OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
]

export default function ThemeToggle() {
  const mode = useSyncExternalStore<ThemeMode>(subscribeToThemePreference, getStoredTheme, () => 'system')

  useEffect(() => {
    applyTheme(mode)

    if (mode !== 'system') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyTheme('system')
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode])

  function handleSelect(next: ThemeMode) {
    localStorage.setItem(THEME_STORAGE_KEY, next)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
      <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
        {OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={mode === option.key}
            onClick={() => handleSelect(option.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === option.key
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
