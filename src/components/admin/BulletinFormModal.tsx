'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import type { Bulletin } from '@prisma/client'

const CATEGORIES = [
  { value: 'Renovation', label: 'Renovation' },
  { value: 'Closure', label: 'Facility Closure' },
  { value: 'Tournament', label: 'Tournament' },
  { value: 'Community', label: 'Community Event' },
  { value: 'General', label: 'General Announcement' },
  { value: 'FacilityMaintenance', label: 'Facility Maintenance' },
] as const
const PRIORITIES = ['Normal', 'High'] as const

function toDateTimeLocalValue(date: Date | null | undefined): string {
  if (!date) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

interface BulletinFormModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  bulletin?: Bulletin
}

export default function BulletinFormModal({ isOpen, onClose, mode, bulletin }: BulletinFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? 'Add Bulletin' : 'Edit Bulletin'}
      maxWidthClassName="max-w-3xl"
    >
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
  const [priority, setPriority] = useState<string>(bulletin?.priority ?? 'Normal')
  const [affectedFacility, setAffectedFacility] = useState(bulletin?.affectedFacility ?? '')
  const [impact, setImpact] = useState(bulletin?.impact ?? '')
  const [action, setAction] = useState(bulletin?.action ?? '')
  const [eventStartAt, setEventStartAt] = useState(toDateTimeLocalValue(bulletin?.eventStartAt))
  const [eventEndAt, setEventEndAt] = useState(toDateTimeLocalValue(bulletin?.eventEndAt))
  const [expiresAt, setExpiresAt] = useState(toDateInputValue(bulletin?.expiresAt))
  const [ctaLabel, setCtaLabel] = useState(bulletin?.ctaLabel ?? '')
  const [ctaUrl, setCtaUrl] = useState(bulletin?.ctaUrl ?? '')
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
    if ((ctaLabel.trim() === '') !== (ctaUrl.trim() === '')) {
      setError('CTA Label and CTA URL must be provided together')
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
    formData.set('priority', priority)
    if (socialPlatform) {
      formData.set('socialPlatform', socialPlatform)
      formData.set('socialUrl', socialUrl.trim())
    }
    if (affectedFacility.trim()) formData.set('affectedFacility', affectedFacility.trim())
    if (impact.trim()) formData.set('impact', impact.trim())
    if (action.trim()) formData.set('action', action.trim())
    if (eventStartAt) formData.set('eventStartAt', eventStartAt)
    if (eventEndAt) formData.set('eventEndAt', eventEndAt)
    if (expiresAt) formData.set('expiresAt', expiresAt)
    if (ctaLabel.trim()) {
      formData.set('ctaLabel', ctaLabel.trim())
      formData.set('ctaUrl', ctaUrl.trim())
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
    <form
      onSubmit={handleSubmit}
      className="scrollbar-thin flex max-h-[80vh] flex-col overflow-y-auto pr-1"
    >
      <FormSection title="Content" first>
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
          Description
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          />
        </label>
      </FormSection>

      <FormSection title="Classification">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-gray-900">
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
      </FormSection>

      <FormSection title="Impact Details">
        <label className="flex flex-col gap-1 text-sm text-gray-900">
          Affected Facility
          <input
            type="text"
            value={affectedFacility}
            onChange={(e) => setAffectedFacility(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-900">
          Impact
          <textarea
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            rows={2}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-900">
          Action
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value)}
            rows={2}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          />
        </label>
      </FormSection>

      <FormSection title="Scheduling">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-900">
            Event Start
            <input
              type="datetime-local"
              value={eventStartAt}
              onChange={(e) => setEventStartAt(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-900">
            Event End
            <input
              type="datetime-local"
              value={eventEndAt}
              onChange={(e) => setEventEndAt(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm text-gray-900">
          Expiration
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          />
        </label>
      </FormSection>

      <FormSection title="Media & Links">
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-900">
            CTA Label
            <input
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            />
          </label>

          {ctaLabel && (
            <label className="flex flex-col gap-1 text-sm text-gray-900">
              CTA URL
              <input
                type="text"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
              />
            </label>
          )}
        </div>
      </FormSection>

      <FormSection title="Publish">
        <label className="flex items-center gap-2 text-sm text-gray-900">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
          Published
        </label>
      </FormSection>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
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

function FormSection({
  title,
  first,
  children,
}: {
  title: string
  first?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={first ? 'flex flex-col gap-4' : 'flex flex-col gap-4 border-t border-gray-100 pt-5'}>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h4>
      {children}
    </div>
  )
}
