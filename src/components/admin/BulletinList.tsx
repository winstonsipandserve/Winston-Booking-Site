'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BulletinFormModal from '@/components/admin/BulletinFormModal'
import type { Bulletin } from '@prisma/client'

function PencilIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 20l4.5-1 10-10a2 2 0 0 0 0-2.8l-1.7-1.7a2 2 0 0 0-2.8 0l-10 10L4 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 7h14M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2M6.5 7l.7 12a2 2 0 0 0 2 1.9h5.6a2 2 0 0 0 2-1.9l.7-12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ActionIconButton({
  label,
  onClick,
  variant,
}: {
  label: string
  onClick: () => void
  variant: 'edit' | 'delete'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={variant === 'edit' ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-red-600'}
    >
      {variant === 'edit' ? <PencilIcon className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />}
    </button>
  )
}

interface BulletinListProps {
  bulletins: Bulletin[]
}

export default function BulletinList({ bulletins }: BulletinListProps) {
  const router = useRouter()
  const [editingBulletin, setEditingBulletin] = useState<Bulletin | null>(null)

  async function handleDelete(bulletin: Bulletin) {
    if (!window.confirm(`Delete "${bulletin.title}"? This cannot be undone.`)) {
      return
    }
    try {
      const res = await fetch(`/api/admin/bulletin/${bulletin.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        alert(json?.error ?? 'Failed to delete bulletin.')
        return
      }
      router.refresh()
    } catch {
      alert('Failed to delete bulletin.')
    }
  }

  return (
    <div>
      {bulletins.length === 0 ? (
        <p className="text-sm text-gray-500">No bulletins yet.</p>
      ) : (
        <div className="space-y-4">
          {bulletins.map((bulletin) => (
            <div
              key={bulletin.id}
              className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4"
            >
              {bulletin.imageUrl ? (
                <img
                  src={bulletin.imageUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg border border-gray-200 object-cover"
                />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-lg border border-gray-200 bg-gray-100" />
              )}

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{bulletin.title}</h2>
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {bulletin.category}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      bulletin.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {bulletin.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <p className="mb-1.5 line-clamp-2 text-sm text-gray-600">{bulletin.excerpt}</p>

                {bulletin.publishedAt ? (
                  <p className="text-xs text-gray-500">
                    {bulletin.publishedAt.toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                ) : (
                  <p className="text-xs italic text-gray-400">Not yet published</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <ActionIconButton
                  label={`Edit ${bulletin.title}`}
                  variant="edit"
                  onClick={() => setEditingBulletin(bulletin)}
                />
                <ActionIconButton
                  label={`Delete ${bulletin.title}`}
                  variant="delete"
                  onClick={() => handleDelete(bulletin)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <BulletinFormModal
        isOpen={editingBulletin !== null}
        onClose={() => setEditingBulletin(null)}
        mode="edit"
        bulletin={editingBulletin ?? undefined}
      />
    </div>
  )
}
