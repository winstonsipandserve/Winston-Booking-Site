'use client'

import { useState } from 'react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import { MEMBERSHIP_DISPLAY_STATUS_LABELS, type MembershipDisplayStatus } from '@/lib/membership-display-status'

interface MembershipsExportButtonProps {
  status: MembershipDisplayStatus | 'all'
  totalCount: number
}

export default function MembershipsExportButton({ status, totalCount }: MembershipsExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeFilters: string[] = []
  if (status !== 'all') {
    activeFilters.push(`Status: ${MEMBERSHIP_DISPLAY_STATUS_LABELS[status]}`)
  }

  const message =
    error ??
    (activeFilters.length > 0
      ? `This will export ${totalCount} membership${totalCount === 1 ? '' : 's'} matching your current filter (${activeFilters.join(', ')}) as a CSV file.`
      : `This will export all ${totalCount} membership${totalCount === 1 ? '' : 's'} as a CSV file. No filter is currently applied.`)

  function openModal() {
    setError(null)
    setIsOpen(true)
  }

  function closeModal() {
    setError(null)
    setIsOpen(false)
  }

  async function handleConfirm() {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (status !== 'all') params.set('status', status)

      const res = await fetch(`/api/admin/memberships/export?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? 'Export failed')
        return
      }

      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = /filename="([^"]+)"/.exec(disposition)
      const filename = match?.[1] ?? 'memberships-export.csv'

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setIsOpen(false)
      setError(null)
    } catch {
      setError('Export failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Export
      </button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title="Export Memberships"
        message={message}
        confirmLabel="Export CSV"
        isLoading={isLoading}
      />
    </>
  )
}
