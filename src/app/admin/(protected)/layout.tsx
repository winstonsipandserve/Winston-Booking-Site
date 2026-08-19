import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-gray-50 p-4 font-sans text-gray-900">
      <AdminTopbar email={session.user?.email ?? ''} />
      <div className="flex flex-1 gap-4">
        <AdminSidebar />
        <main className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  )
}
