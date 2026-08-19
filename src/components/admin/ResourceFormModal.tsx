'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'

interface ResourceFormModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  resourceTypeId?: string
  resource?: { id: string; label: string; isActive: boolean }
}

export default function ResourceFormModal({
  isOpen,
  onClose,
  mode,
  resourceTypeId,
  resource,
}: ResourceFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add Resource' : 'Edit Resource'}>
      {isOpen && (
        <ResourceForm
          mode={mode}
          resourceTypeId={resourceTypeId}
          resource={resource}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}

function ResourceForm({
  mode,
  resourceTypeId,
  resource,
  onClose,
}: {
  mode: 'add' | 'edit'
  resourceTypeId?: string
  resource?: { id: string; label: string; isActive: boolean }
  onClose: () => void
}) {
  const router = useRouter()
  const [label, setLabel] = useState(mode === 'edit' ? (resource?.label ?? '') : '')
  const [isActive, setIsActive] = useState(mode === 'edit' ? (resource?.isActive ?? true) : true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) {
      setError('Label is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res =
        mode === 'add'
          ? await fetch('/api/admin/resources', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resourceTypeId, label: label.trim() }),
            })
          : await fetch(`/api/admin/resources/${resource?.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ label: label.trim(), isActive }),
            })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        setError(json?.error ?? 'Something went wrong. Please try again.')
        setIsSubmitting(false)
        return
      }

      router.refresh()
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-gray-900">
        Label
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
        />
      </label>

      {mode === 'edit' && (
        <label className="flex items-center gap-2 text-sm text-gray-900">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="mt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mode === 'add' ? 'Add' : 'Save'}
        </button>
      </div>
    </form>
  )
}
