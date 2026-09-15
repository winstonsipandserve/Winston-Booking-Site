'use client'

import { useState } from 'react'
import CheckInScanner from '@/components/admin/CheckInScanner'
import CheckInCodeEntry from '@/components/admin/CheckInCodeEntry'

const TABS = [
  { label: 'Enter Code', value: 'code' as const },
  { label: 'Scan QR', value: 'scan' as const },
]

type Tab = (typeof TABS)[number]['value']

// Code entry is the default so the front desk lands on a ready, focused input; the camera
// is one click away rather than the other way round (it prompts for permission on mount).
export default function CheckInTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('code')

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Check in a member</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Type the 6-digit code from their account, or scan their QR.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Check-in method"
        className="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'scan' && <CheckInScanner />}
      {activeTab === 'code' && <CheckInCodeEntry />}
    </div>
  )
}
