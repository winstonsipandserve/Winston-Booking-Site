import SignOutButton from '@/components/admin/SignOutButton'
import { FoldIcon } from '@/components/admin/AdminIcons'
import { SIDEBAR_COLLAPSED_WIDTH_CLASS, SIDEBAR_WIDTH_CLASS } from '@/components/admin/AdminSidebar'

export default function AdminTopbar({
  email,
  collapsed,
  onToggleSidebar,
}: {
  email: string
  collapsed: boolean
  onToggleSidebar: () => void
}) {
  const initials = email.slice(0, 2).toUpperCase() || '?'

  return (
    <header className="flex h-16 shrink-0 items-center">
      {/* Brand column shares its width with the sidebar so the two read as one connected frame. */}
      <div
        className={`flex h-full shrink-0 items-center gap-2.5 overflow-hidden transition-[width] duration-200 ${
          collapsed
            ? `${SIDEBAR_COLLAPSED_WIDTH_CLASS} justify-center`
            : `${SIDEBAR_WIDTH_CLASS} px-5`
        }`}
      >
        <span
          role="img"
          aria-label="Winston Sip & Serve"
          className="h-8 w-8 shrink-0 bg-gray-900 dark:bg-gray-100"
          style={{
            WebkitMaskImage: 'url(/images/brand/winston-logo-emblem-transparent.png)',
            maskImage: 'url(/images/brand/winston-logo-emblem-transparent.png)',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
        {!collapsed && (
          <span className="whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
            Winston Admin
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between pr-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          <FoldIcon
            className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              {initials}
            </div>
            <div className="hidden leading-tight md:block">
              <p className="max-w-[200px] truncate text-xs font-semibold text-gray-900 dark:text-gray-100">
                {email}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Admin</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
