'use client'

import { useEffect, useState } from 'react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import { formatBulletinDate } from '@/lib/format'

interface AdminUserRow {
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: string
}

export default function AdminUsersTab() {
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pendingTarget, setPendingTarget] = useState<AdminUserRow | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void loadAdminUsers()
  }, [])

  async function loadAdminUsers() {
    setLoadError(null)
    try {
      const res = await fetch('/api/admin/admin-users')
      if (!res.ok) {
        setLoadError('Failed to load admin users.')
        return
      }
      const json = (await res.json()) as AdminUserRow[]
      setAdminUsers(json)
    } catch {
      setLoadError('Failed to load admin users.')
    }
  }

  function openConfirm(user: AdminUserRow) {
    setActionError(null)
    setPendingTarget(user)
  }

  async function handleConfirm() {
    if (!pendingTarget) return
    setIsSubmitting(true)
    setActionError(null)

    try {
      const res = await fetch(`/api/admin/admin-users/${pendingTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !pendingTarget.isActive }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        setActionError(json?.error ?? 'Something went wrong. Please try again.')
        setIsSubmitting(false)
        return
      }

      setIsSubmitting(false)
      setPendingTarget(null)
      await loadAdminUsers()
    } catch {
      setActionError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (loadError) {
    return <p className="text-sm text-red-600">{loadError}</p>
  }

  if (!adminUsers) {
    return <p className="text-sm text-gray-500">Loading…</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Name</th>
            <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Email</th>
            <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Status</th>
            <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Created</th>
            <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {adminUsers.map((user) => (
            <tr key={user.id} className="border-b border-gray-100 last:border-b-0">
              <td className="px-3 py-2 text-gray-900">{user.name}</td>
              <td className="px-3 py-2 text-gray-900">{user.email}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-3 py-2 text-gray-500">{formatBulletinDate(new Date(user.createdAt))}</td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => openConfirm(user)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  {user.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmModal
        isOpen={pendingTarget !== null}
        onClose={() => {
          setPendingTarget(null)
          setActionError(null)
        }}
        onConfirm={handleConfirm}
        title={pendingTarget?.isActive ? 'Deactivate Admin?' : 'Reactivate Admin?'}
        message={
          actionError ??
          (pendingTarget?.isActive
            ? `Deactivate ${pendingTarget?.name}? They will be signed out immediately and won't be able to sign back in until reactivated.`
            : `Reactivate ${pendingTarget?.name}? They will be able to sign in again.`)
        }
        confirmLabel={pendingTarget?.isActive ? 'Deactivate' : 'Reactivate'}
        confirmVariant={pendingTarget?.isActive ? 'danger' : 'default'}
        isLoading={isSubmitting}
      />
    </div>
  )
}
