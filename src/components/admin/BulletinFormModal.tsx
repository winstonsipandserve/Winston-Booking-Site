'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import type { Bulletin } from '@prisma/client'

const CATEGORIES = ['Renovation', 'Closure', 'Tournament', 'Community'] as const

interface BulletinFormModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  bulletin?: Bulletin
}

export default function BulletinFormModal({ isOpen, onClose, mode, bulletin }: BulletinFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add Bulletin' : 'Edit Bulletin'}>
      {isOpen && <BulletinForm mode={mode} bulletin={bulletin} onClose={onClose} />}
    </Modal>
  )
}

function BulletinForm({
  mode,
  bulletin,
  onClose,
}: {
  mode: 'add' | 'edit'
  bulletin?: Bulletin
  onClose: () => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState(bulletin?.title ?? '')
  const [excerpt, setExcerpt] = useState(bulletin?.excerpt ?? '')
  const [body, setBody] = useState(bulletin?.body ?? '')
  const [category, setCategory] = useState<string>(bulletin?.category ?? '')
  const [socialPlatform, setSocialPlatform] = useState<string>(bulletin?.socialPlatform ?? '')
  const [socialUrl, setSocialUrl] = useState(bulletin?.socialUrl ?? '')
  const [isPublished, setIsPublished] = useState(bulletin?.isPublished ?? false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(bulletin?.imageUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : (bulletin?.imageUrl ?? null))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!excerpt.trim()) {
      setError('Excerpt is required')
      return
    }
    if (!body.trim()) {
      setError('Body is required')
      return
    }
    if (!category) {
      setError('Category is required')
      return
    }
    if (mode === 'add' && !imageFile) {
      setError('Image is required')
      return
    }
    if ((socialPlatform === '') !== (socialUrl.trim() === '')) {
      setError('Social Platform and Social URL must be provided together')
      return
    }

    setError(null)
    setIsSubmitting(true)

    const formData = new FormData()
    formData.set('title', title.trim())
    formData.set('excerpt', excerpt.trim())
    formData.set('body', body.trim())
    formData.set('category', category)
    formData.set('isPublished', String(isPublished))
    if (socialPlatform) {
      formData.set('socialPlatform', socialPlatform)
      formData.set('socialUrl', socialUrl.trim())
    }
    if (imageFile) {
      formData.set('image', imageFile)
    }

    try {
      const res =
        mode === 'add'
          ? await fetch('/api/admin/bulletin', { method: 'POST', body: formData })
          : await fetch(`/api/admin/bulletin/${bulletin?.id}`, { method: 'PATCH', body: formData })

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
    <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
      <label className="flex flex-col gap-1 text-sm text-gray-900">
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-900">
        Excerpt
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-900">
        Body
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-900">
        Category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
        >
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-900">
        Image{mode === 'edit' ? ' (optional — leave blank to keep current)' : ''}
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleImageChange}
          className="text-sm text-gray-900"
        />
      </label>
      {imagePreview && (
        <img
          src={imagePreview}
          alt=""
          className="h-24 w-24 rounded-lg border border-gray-200 object-cover"
        />
      )}

      <label className="flex flex-col gap-1 text-sm text-gray-900">
        Social Platform
        <select
          value={socialPlatform}
          onChange={(e) => setSocialPlatform(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
        >
          <option value="">None</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
        </select>
      </label>

      {socialPlatform && (
        <label className="flex flex-col gap-1 text-sm text-gray-900">
          Social URL
          <input
            type="text"
            value={socialUrl}
            onChange={(e) => setSocialUrl(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          />
        </label>
      )}

      <label className="flex items-center gap-2 text-sm text-gray-900">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        Published
      </label>

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
