import Link from 'next/link'
import {
  FoldIcon,
  DashboardIcon,
  BookingsIcon,
  ResourcesIcon,
  MembershipsIcon,
  BulletinIcon,
  NewsIcon,
  CheckInIcon,
  SettingsIcon,
} from '@/components/admin/AdminIcons'

export const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: DashboardIcon },
  { href: '/admin/bookings', label: 'Bookings', icon: BookingsIcon },
  { href: '/admin/resources', label: 'Resources & Pricing', icon: ResourcesIcon },
  { href: '/admin/memberships', label: 'Memberships', icon: MembershipsIcon },
  { href: '/admin/announcements', label: 'Announcements', icon: BulletinIcon },
  { href: '/admin/news', label: 'News', icon: NewsIcon },
  { href: '/admin/check-in', label: 'Check-In', icon: CheckInIcon },
  { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

// Shared by the sidebar and the topbar's brand column so they stay aligned as one frame.
export const SIDEBAR_WIDTH_CLASS = 'w-[240px]'
export const SIDEBAR_COLLAPSED_WIDTH_CLASS = 'w-[72px]'

export function SidebarFoldButton({
  collapsed,
  onClick,
}: {
  collapsed: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!collapsed}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
    >
      <FoldIcon className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
    </button>
  )
}

export default function AdminSidebar({
  collapsed,
  onToggleSidebar,
  pathname,
}: {
  collapsed: boolean
  onToggleSidebar: () => void
  pathname: string
}) {
  return (
    <aside
      className={`flex shrink-0 flex-col px-3 pb-4 pt-1 transition-[width] duration-200 ${
        collapsed ? SIDEBAR_COLLAPSED_WIDTH_CLASS : SIDEBAR_WIDTH_CLASS
      }`}
    >
      {/* When expanded the fold button lives here, level with the Menu label; when collapsed it moves up to the topbar. */}
      {!collapsed && (
        <div className="flex items-center justify-between pb-2 pl-3 pr-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Menu
          </span>
          <SidebarFoldButton collapsed={collapsed} onClick={onToggleSidebar} />
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-gray-900 font-semibold text-white shadow-sm dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
