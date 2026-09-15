'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { MoreIcon } from '@/components/admin/AdminIcons'

export interface RowAction {
  label: string
  onSelect: () => void
  icon?: React.ComponentType<{ className?: string }>
  /** Destructive actions render in red and are separated from the rest. */
  danger?: boolean
}

/**
 * Overflow ("⋯") menu for a list row. Keeps destructive actions off the row surface so a
 * stray click can't reach them; the caller still confirms before doing anything irreversible.
 */
export default function RowActionsMenu({ label, actions }: { label: string; actions: RowAction[] }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const safeActions = actions.filter((action) => !action.danger)
  const dangerActions = actions.filter((action) => action.danger)

  function renderAction(action: RowAction) {
    const Icon = action.icon
    return (
      <button
        key={action.label}
        type="button"
        role="menuitem"
        onClick={() => {
          setOpen(false)
          action.onSelect()
        }}
        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
          action.danger
            ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-100'
        }`}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
        {action.label}
      </button>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        title="More actions"
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 ${
          open ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100' : ''
        }`}
      >
        <MoreIcon className="h-5 w-5" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {safeActions.map(renderAction)}
          {dangerActions.length > 0 && (
            <div className={safeActions.length > 0 ? 'mt-1 border-t border-gray-100 pt-1 dark:border-gray-800' : ''}>
              {dangerActions.map(renderAction)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
