import { redirect } from 'next/navigation'
import { getActiveAdminSession } from '@/lib/admin-session'
import SettingsTabs from '@/components/admin/SettingsTabs'

export default async function AdminSettingsPage() {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    redirect('/admin/login')
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Settings</h1>
      <SettingsTabs name={activeSession.adminUser.name} email={activeSession.adminUser.email} />
    </div>
  )
}
