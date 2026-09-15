'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar, { NAV_ITEMS } from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'

function resolveSectionLabel(pathname: string) {
  const match = NAV_ITEMS.find((item) =>
    item.href === '/admin'
      ? pathname === '/admin'
      : pathname === item.href || pathname.startsWith(item.href + '/'),
  )
  return match?.label ?? 'Admin'
}

export default function AdminShell({
  email,
  children,
}: {
  email: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const toggleSidebar = () => setCollapsed((prev) => !prev)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <AdminTopbar
        email={email}
        collapsed={collapsed}
        onToggleSidebar={toggleSidebar}
        sectionLabel={resolveSectionLabel(pathname)}
      />
      <div className="flex min-h-0 flex-1">
        <AdminSidebar collapsed={collapsed} onToggleSidebar={toggleSidebar} pathname={pathname} />
        <main className="mb-4 mr-4 min-h-0 min-w-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-200 p-6 scrollbar-thin dark:border-gray-800 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  )
}
