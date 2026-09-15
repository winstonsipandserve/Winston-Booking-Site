import { redirect } from 'next/navigation'
import { getActiveAdminSession } from '@/lib/admin-session'
import SettingsTabs from '@/components/admin/SettingsTabs'

export default async function AdminSettingsPage() {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    redirect('/admin/login')
  }

  return (
    <div className="relative isolate flex h-full flex-col gap-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 hidden -z-10 dark:block dark:rounded-2xl dark:bg-gray-900"
      />
      <SettingsTabs name={activeSession.adminUser.name} email={activeSession.adminUser.email} />
    </div>
  )
}
