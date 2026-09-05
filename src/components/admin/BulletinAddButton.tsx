'use client'

import { useState } from 'react'
import BulletinFormModal from '@/components/admin/BulletinFormModal'

export default function BulletinAddButton() {
  const [addModalOpen, setAddModalOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAddModalOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        + Add Bulletin
      </button>

      <BulletinFormModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} mode="add" />
    </>
  )
}
