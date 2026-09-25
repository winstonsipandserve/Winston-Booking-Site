'use client'

import { useId, useState } from 'react'
import AdminTabs, { AdminTabPanel } from '@/components/admin/AdminTabs'
import MyAccountTab from '@/components/admin/MyAccountTab'
import AdminUsersTab from '@/components/admin/AdminUsersTab'
import ActivityLogTab from '@/components/admin/ActivityLogTab'

type Tab = 'account' | 'adminUsers' | 'activityLog'

interface SettingsTabsProps {
  name: string
  email: string
}

export default function SettingsTabs({ name, email }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const idPrefix = useId()

  const TAB_ITEMS: { key: Tab; label: string }[] = [
    { key: 'account', label: 'My Account' },
    { key: 'adminUsers', label: 'Admin Users' },
    { key: 'activityLog', label: 'Activity Log' },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminTabs
        items={TAB_ITEMS}
        value={activeTab}
        onChange={setActiveTab}
        label="Settings sections"
        idPrefix={idPrefix}
        className="mb-6"
      />

      <AdminTabPanel idPrefix={idPrefix} tabKey={activeTab} className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-thin">
        {activeTab === 'account' && <MyAccountTab name={name} email={email} />}
        {activeTab === 'adminUsers' && <AdminUsersTab />}
        {activeTab === 'activityLog' && <ActivityLogTab />}
      </AdminTabPanel>
    </div>
  )
}
