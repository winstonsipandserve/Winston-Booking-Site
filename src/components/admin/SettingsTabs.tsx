'use client'

import { useState } from 'react'
import MyAccountTab from '@/components/admin/MyAccountTab'
import AdminUsersTab from '@/components/admin/AdminUsersTab'

type Tab = 'account' | 'adminUsers'

interface SettingsTabsProps {
  name: string
  email: string
}

export default function SettingsTabs({ name, email }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('account')

  const TAB_ITEMS: { key: Tab; label: string }[] = [
    { key: 'account', label: 'My Account' },
    { key: 'adminUsers', label: 'Admin Users' },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" className="mb-6 flex flex-wrap gap-2">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'account' && <MyAccountTab name={name} email={email} />}
        {activeTab === 'adminUsers' && <AdminUsersTab />}
      </div>
    </div>
  )
}
