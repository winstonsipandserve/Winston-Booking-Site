'use client'

import { useId, useState } from 'react'
import AdminTabs, { AdminTabPanel } from '@/components/admin/AdminTabs'
import CheckInScanner from '@/components/admin/CheckInScanner'
import CheckInCodeEntry from '@/components/admin/CheckInCodeEntry'

const TABS = [
  { label: 'Enter Code', key: 'code' as const },
  { label: 'Scan QR', key: 'scan' as const },
]

type Tab = (typeof TABS)[number]['key']

// Code entry is the default so the front desk lands on a ready, focused input; the camera
// is one click away rather than the other way round (it prompts for permission on mount).
export default function CheckInTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('code')
  const idPrefix = useId()

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Check in a member</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Type the 6-digit code from their account, or scan their QR.
        </p>
      </div>

      <AdminTabs
        items={TABS}
        value={activeTab}
        onChange={setActiveTab}
        label="Check-in method"
        variant="segmented"
        idPrefix={idPrefix}
      />

      <AdminTabPanel idPrefix={idPrefix} tabKey={activeTab} className="flex w-full flex-col items-center">
        {activeTab === 'scan' && <CheckInScanner />}
        {activeTab === 'code' && <CheckInCodeEntry />}
      </AdminTabPanel>
    </div>
  )
}
