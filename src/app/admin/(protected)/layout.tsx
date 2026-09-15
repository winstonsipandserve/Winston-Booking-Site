import { redirect } from 'next/navigation'
import { getActiveAdminSession } from '@/lib/admin-session'
import AdminThemeInit from '@/components/admin/AdminThemeInit'
import AdminShell from '@/components/admin/AdminShell'

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
    <>
      <AdminThemeInit />
      <AdminShell email={activeSession.adminUser.email}>{children}</AdminShell>
    </>
  )
}
