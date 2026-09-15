'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDownIcon, SettingsIcon, SignOutIcon } from '@/components/admin/AdminIcons'
import SignOutConfirmModal from '@/components/admin/SignOutConfirmModal'
import ThemeSegmentedControl from '@/components/admin/ThemeSegmentedControl'
import { useAdminTheme } from '@/lib/admin-theme'

const MENU_ITEM_CLASS =
  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-100'

export default function AdminAvatarMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  // The theme hook lives here (always mounted) so the dark class tracks the stored
  // preference and OS changes on every admin page, not only while a toggle is visible.
  const { mode, setMode } = useAdminTheme()
  const initials = email.slice(0, 2).toUpperCase() || '?'

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

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-gray-200/70 dark:hover:bg-gray-800"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
          {initials}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-[200px] truncate text-xs font-semibold text-gray-900 dark:text-gray-100">
            {email}
          </span>
          <span className="block text-[11px] text-gray-500 dark:text-gray-400">Admin</span>
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Signed in as
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-gray-100" title={email}>
              {email}
            </p>
          </div>

          <div className="border-t border-gray-100 px-2.5 py-2.5 dark:border-gray-800">
            <p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">Appearance</p>
            <ThemeSegmentedControl mode={mode} onChange={setMode} />
          </div>

          <div className="border-t border-gray-100 pt-1.5 dark:border-gray-800">
            <Link
              href="/admin/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={MENU_ITEM_CLASS}
            >
              <SettingsIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              My account
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                setSignOutOpen(true)
              }}
              className={MENU_ITEM_CLASS}
            >
              <SignOutIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              Sign out
            </button>
          </div>
        </div>
      )}

      <SignOutConfirmModal isOpen={signOutOpen} onClose={() => setSignOutOpen(false)} />
    </div>
  )
}
