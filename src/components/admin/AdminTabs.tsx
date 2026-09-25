'use client'

import { useRef } from 'react'

export interface AdminTabItem<T extends string> {
  key: T
  label: string
}

interface AdminTabsProps<T extends string> {
  items: AdminTabItem<T>[]
  value: T
  onChange: (key: T) => void
  /** Accessible name for the tab list, e.g. "Settings sections". */
  label: string
  /** `pill` is the page-level strip (Settings, Resources); `segmented` is the inset toggle (Check-In). */
  variant?: 'pill' | 'segmented'
  className?: string
  /** Stable prefix (from `useId()`) shared with the matching `AdminTabPanel`s. */
  idPrefix: string
}

/**
 * WAI-ARIA tabs: roving tabindex, ←/→/Home/End keyboard movement, and `aria-controls`
 * wired to a panel rendered through `AdminTabPanel` with the same `idPrefix`.
 */
export function tabId(prefix: string, key: string) {
  return `${prefix}-tab-${key}`
}

export function panelId(prefix: string, key: string) {
  return `${prefix}-panel-${key}`
}

export default function AdminTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  variant = 'pill',
  className = '',
  idPrefix,
}: AdminTabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)

  function focusTab(index: number) {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    const next = buttons?.[(index + items.length) % items.length]
    next?.focus()
    const item = items[(index + items.length) % items.length]
    if (item) onChange(item.key)
  }

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusTab(index + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusTab(index - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusTab(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusTab(items.length - 1)
    }
  }

  const listClass =
    variant === 'segmented'
      ? 'inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800'
      : 'flex flex-wrap gap-2'

  return (
    <div ref={listRef} role="tablist" aria-label={label} className={`${listClass} ${className}`}>
      {items.map((item, index) => {
        const selected = item.key === value
        const buttonClass =
          variant === 'segmented'
            ? `rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`
            : `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selected
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 hover:bg-gray-200/70 dark:text-gray-300 dark:hover:bg-gray-800'
              }`
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={tabId(idPrefix, item.key)}
            aria-selected={selected}
            aria-controls={panelId(idPrefix, item.key)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={buttonClass}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export function AdminTabPanel({
  idPrefix,
  tabKey,
  className = '',
  children,
}: {
  idPrefix: string
  tabKey: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="tabpanel"
      id={panelId(idPrefix, tabKey)}
      aria-labelledby={tabId(idPrefix, tabKey)}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  )
}
