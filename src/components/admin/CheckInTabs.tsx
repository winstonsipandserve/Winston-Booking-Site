'use client'

import { useState } from 'react'
import CheckInScanner from '@/components/admin/CheckInScanner'
import CheckInCodeEntry from '@/components/admin/CheckInCodeEntry'

const TABS = [
  { label: 'Scan', value: 'scan' as const },
  { label: 'Enter Code', value: 'code' as const },
]

type Tab = (typeof TABS)[number]['value']

export default function CheckInTabs() {
  const [activeTab, setActiveTab] = useState<Tab | null>(null)

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                isActive
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === null && (
        <p className="text-sm text-gray-500">Choose Scan or Enter Code to check in a member.</p>
      )}
      {activeTab === 'scan' && <CheckInScanner />}
      {activeTab === 'code' && <CheckInCodeEntry />}
    </div>
  )
}
