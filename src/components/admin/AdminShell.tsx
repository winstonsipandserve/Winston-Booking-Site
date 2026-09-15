'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'

export default function AdminShell({
  email,
  children,
}: {
  email: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <AdminTopbar
        email={email}
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed((prev) => !prev)}
      />
      <div className="flex min-h-0 flex-1">
        <AdminSidebar collapsed={collapsed} pathname={pathname} />
        <main className="mb-4 mr-4 min-h-0 min-w-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-sm scrollbar-thin dark:border-gray-800">
          {children}
        </main>
      </div>
    </div>
  )
}
