'use client'

import { useLayoutEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar, { NAV_ITEMS } from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'
import ToastProvider from '@/components/admin/ToastProvider'

// Below Tailwind's `lg` breakpoint the sidebar starts collapsed so the content well keeps
// its width on laptops and tablets. Crossing the breakpoint re-applies the default;
// a manual toggle in between is respected until the next crossing.
const SIDEBAR_AUTO_COLLAPSE_QUERY = '(max-width: 1023px)'

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

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia(SIDEBAR_AUTO_COLLAPSE_QUERY)
    const applyDefault = () => setCollapsed(mediaQuery.matches)
    applyDefault()
    mediaQuery.addEventListener('change', applyDefault)
    return () => mediaQuery.removeEventListener('change', applyDefault)
  }, [])

  return (
    <ToastProvider>
      <div className="admin-root flex h-screen flex-col overflow-hidden bg-gray-50 font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <AdminTopbar
          email={email}
          collapsed={collapsed}
          onToggleSidebar={toggleSidebar}
          sectionLabel={resolveSectionLabel(pathname)}
        />
        <div className="flex min-h-0 flex-1">
          <AdminSidebar collapsed={collapsed} onToggleSidebar={toggleSidebar} pathname={pathname} />
          <main className="mb-4 mr-4 min-h-0 min-w-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-100 p-6 scrollbar-thin dark:border-gray-800 dark:bg-gray-950">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
