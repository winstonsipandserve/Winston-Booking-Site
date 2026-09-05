import { redirect } from 'next/navigation'
import { getActiveAdminSession } from '@/lib/admin-session'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const activeSession = await getActiveAdminSession()

  if (!activeSession) {
    redirect('/admin/login')
  }

  return (
    <div className="flex h-screen flex-col gap-4 overflow-hidden bg-gray-50 p-4 font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('winston-admin-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');}}catch(e){}})();`,
        }}
      />
      <AdminTopbar email={activeSession.adminUser.email} />
      <div className="flex min-h-0 flex-1 gap-4">
        <AdminSidebar />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-sm scrollbar-thin dark:border-gray-800">
          {children}
        </main>
      </div>
    </div>
  )
}
