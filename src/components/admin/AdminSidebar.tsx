'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DashboardIcon,
  BookingsIcon,
  ResourcesIcon,
  MembershipsIcon,
  BulletinIcon,
  FoldIcon,
} from '@/components/admin/AdminIcons'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: DashboardIcon },
  { href: '/admin/bookings', label: 'Bookings', icon: BookingsIcon },
  { href: '/admin/resources', label: 'Resources & Pricing', icon: ResourcesIcon },
  { href: '/admin/memberships', label: 'Memberships', icon: MembershipsIcon },
  { href: '/admin/bulletin', label: 'Bulletin', icon: BulletinIcon },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`flex shrink-0 flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-[232px]'
      }`}
    >
      <div className={`flex items-center px-1 pb-1 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Menu</span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <FoldIcon
            className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

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
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-gray-900 font-semibold text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
