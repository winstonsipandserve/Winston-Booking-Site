import { redirect } from 'next/navigation'
import { getActiveAdminSession } from '@/lib/admin-session'
import SettingsTabs from '@/components/admin/SettingsTabs'

export default async function AdminSettingsPage() {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    redirect('/admin/login')
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      <SettingsTabs name={activeSession.adminUser.name} email={activeSession.adminUser.email} />
    </div>
  )
}
