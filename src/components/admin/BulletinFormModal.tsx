'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import type { Bulletin } from '@prisma/client'
import {
  BULLETIN_CATEGORY_RULES,
  isValidCategory,
  VALID_BOOKING_IMPACTS,
  BOOKING_IMPACT_LABELS,
  VALID_CUSTOMER_ACTIONS,
  CUSTOMER_ACTION_LABELS,
  VALID_CUSTOMER_ELIGIBILITIES,
  CUSTOMER_ELIGIBILITY_LABELS,
} from '@/lib/bulletin-validation'

export interface ResourceOption {
  id: string
  displayName: string
}

type BulletinWithOptionalResourceLinks = Bulletin & {
  resourceLinks?: { resourceId: string }[]
}

const CATEGORIES = [
  { value: 'Renovation', label: 'Renovation' },
  { value: 'Closure', label: 'Facility Closure' },
  { value: 'Tournament', label: 'Tournament' },
  { value: 'Community', label: 'Community Event' },
  { value: 'General', label: 'General Announcement' },
  { value: 'FacilityMaintenance', label: 'Facility Maintenance' },
  { value: 'Promotion', label: 'Promotion' },
] as const

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
  bulletin?: BulletinWithOptionalResourceLinks
  resourceOptions: ResourceOption[]
}

export default function BulletinFormModal({ isOpen, onClose, mode, bulletin, resourceOptions }: BulletinFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? 'Add Bulletin' : 'Edit Bulletin'}
      maxWidthClassName="max-w-3xl"
      variant="neutral"
    >
      {isOpen && (
        <BulletinForm mode={mode} bulletin={bulletin} resourceOptions={resourceOptions} onClose={onClose} />
      )}
    </Modal>
  )
}

function BulletinForm({
  mode,
  bulletin,
  resourceOptions,
  onClose,
}: {
  mode: 'add' | 'edit'
  bulletin?: BulletinWithOptionalResourceLinks
  resourceOptions: ResourceOption[]
  onClose: () => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState(bulletin?.title ?? '')
  const [excerpt, setExcerpt] = useState(bulletin?.excerpt ?? '')
  const [body, setBody] = useState(bulletin?.body ?? '')
  const [category, setCategory] = useState<string>(bulletin?.category ?? '')
  const [socialPlatform, setSocialPlatform] = useState<string>(bulletin?.socialPlatform ?? '')
  const [socialUrl, setSocialUrl] = useState(bulletin?.socialUrl ?? '')
  const [affectedFacility, setAffectedFacility] = useState(bulletin?.affectedFacility ?? '')
  const [impact, setImpact] = useState(bulletin?.impact ?? '')
  const [action, setAction] = useState(bulletin?.action ?? '')
  const [bookingImpact, setBookingImpact] = useState<string>(bulletin?.bookingImpact ?? '')
  const [customerActionType, setCustomerActionType] = useState<string>(bulletin?.customerActionType ?? '')
  const [promoCode, setPromoCode] = useState(bulletin?.promoCode ?? '')
  const [discountSummary, setDiscountSummary] = useState(bulletin?.discountSummary ?? '')
  const [customerEligibility, setCustomerEligibility] = useState<string>(bulletin?.customerEligibility ?? '')
  const [eventStartAt, setEventStartAt] = useState(toDateTimeLocalValue(bulletin?.eventStartAt))
  const [eventEndAt, setEventEndAt] = useState(toDateTimeLocalValue(bulletin?.eventEndAt))
  const [expiresAt, setExpiresAt] = useState(toDateInputValue(bulletin?.expiresAt))
  const [ctaLabel, setCtaLabel] = useState(bulletin?.ctaLabel ?? '')
  const [ctaUrl, setCtaUrl] = useState(bulletin?.ctaUrl ?? '')
  const [isPublished, setIsPublished] = useState(bulletin?.isPublished ?? false)
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>(
    bulletin?.resourceLinks?.map((l) => l.resourceId) ?? [],
  )
  const [autoDisableResources, setAutoDisableResources] = useState(bulletin?.autoDisableResources ?? false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(bulletin?.imageUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const rules = category && isValidCategory(category) ? BULLETIN_CATEGORY_RULES[category] : null
  const isPromotion = category === 'Promotion'

  function handleCategoryChange(value: string) {
    setCategory(value)
    // A promotion doesn't disrupt bookings, so don't make the admin pick a Booking
    // Impact/Customer Action — default them instead of showing blank required selects.
    if (value === 'Promotion') {
      if (!bookingImpact) setBookingImpact('NoImpact')
      if (!customerActionType) setCustomerActionType('NoActionRequired')
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : (bulletin?.imageUrl ?? null))
  }

  function toggleResource(resourceId: string) {
    setSelectedResourceIds((prev) => {
      const next = prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
      if (next.length === 0) setAutoDisableResources(false)
      return next
    })
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
    if (rules?.requireImpactFields && !affectedFacility.trim()) {
      setError('Affected Facility is required')
      return
    }
    if (rules?.requireImpactFields && !impact.trim()) {
      setError('Impact is required')
      return
    }
    if (rules?.requireImpactFields && !action.trim()) {
      setError('Action is required')
      return
    }
    if (!bookingImpact) {
      setError('Booking Impact is required')
      return
    }
    if (!customerActionType) {
      setError('Customer Action is required')
      return
    }
    if (rules?.requireDiscountSummary && !discountSummary.trim()) {
      setError('Discount Summary is required for this category')
      return
    }
    if (!eventStartAt) {
      setError('Event Start is required')
      return
    }
    if (rules?.requireEventEndAt && !eventEndAt) {
      setError('Event End is required for this category')
      return
    }
    if (rules?.requireExpiresAt && !expiresAt) {
      setError('Expiration is required for this category')
      return
    }
    if (rules?.requireImage) {
      const hasImage = mode === 'add' ? Boolean(imageFile) : Boolean(imageFile) || Boolean(bulletin?.imageUrl)
      if (!hasImage) {
        setError('Image is required for this category')
        return
      }
    }
    if ((socialPlatform === '') !== (socialUrl.trim() === '')) {
      setError('Social Platform and Social URL must be provided together')
      return
    }
    if ((ctaLabel.trim() === '') !== (ctaUrl.trim() === '')) {
      setError('CTA Label and CTA URL must be provided together')
      return
    }
    if (rules?.requireCta && (!ctaLabel.trim() || !ctaUrl.trim())) {
      setError('CTA Label and CTA URL are required for this category')
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
    formData.set('resourceIds', JSON.stringify(selectedResourceIds))
    formData.set('autoDisableResources', String(autoDisableResources))
    if (socialPlatform) {
      formData.set('socialPlatform', socialPlatform)
      formData.set('socialUrl', socialUrl.trim())
    }
    if (affectedFacility.trim()) formData.set('affectedFacility', affectedFacility.trim())
    if (impact.trim()) formData.set('impact', impact.trim())
    if (action.trim()) formData.set('action', action.trim())
    if (bookingImpact) formData.set('bookingImpact', bookingImpact)
    if (customerActionType) formData.set('customerActionType', customerActionType)
    if (promoCode.trim()) formData.set('promoCode', promoCode.trim())
    if (discountSummary.trim()) formData.set('discountSummary', discountSummary.trim())
    if (customerEligibility) formData.set('customerEligibility', customerEligibility)
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
      <FormSection title="Details" first>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
            Category *
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              autoFocus
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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

          <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
            Title *
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
        </div>
      </FormSection>

      <FormSection title="Content">
        <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
          Excerpt *
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
          Description *
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
      </FormSection>

      {isPromotion && (
        <FormSection title="Promotion Details">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
              Promo Code
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
              Discount Summary *
              <input
                type="text"
                value={discountSummary}
                onChange={(e) => setDiscountSummary(e.target.value)}
                placeholder="e.g. 20% off"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
            Customer Eligibility
            <select
              value={customerEligibility}
              onChange={(e) => setCustomerEligibility(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">None specified</option>
              {VALID_CUSTOMER_ELIGIBILITIES.map((value) => (
                <option key={value} value={value}>
                  {CUSTOMER_ELIGIBILITY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
        </FormSection>
      )}

      <FormSection title="Impact Details">
        <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
          Affected Facility{rules?.requireImpactFields ? ' *' : ''}
          <input
            type="text"
            value={affectedFacility}
            onChange={(e) => setAffectedFacility(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
          Impact{rules?.requireImpactFields ? ' *' : ''}
          <textarea
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            rows={2}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
          Action{rules?.requireImpactFields ? ' *' : ''}
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value)}
            rows={2}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        {!isPromotion && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
              Booking Impact *
              <select
                value={bookingImpact}
                onChange={(e) => setBookingImpact(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="" disabled>
                  Select booking impact
                </option>
                {VALID_BOOKING_IMPACTS.map((value) => (
                  <option key={value} value={value}>
                    {BOOKING_IMPACT_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
              Customer Action *
              <select
                value={customerActionType}
                onChange={(e) => setCustomerActionType(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="" disabled>
                  Select customer action
                </option>
                {VALID_CUSTOMER_ACTIONS.map((value) => (
                  <option key={value} value={value}>
                    {CUSTOMER_ACTION_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </FormSection>

      <FormSection title="Scheduling">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
            Event Start *
            <input
              type="datetime-local"
              value={eventStartAt}
              onChange={(e) => setEventStartAt(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
            Event End{rules?.requireEventEndAt ? ' *' : ''}
            <input
              type="datetime-local"
              value={eventEndAt}
              onChange={(e) => setEventEndAt(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
          Expiration{rules?.requireExpiresAt ? ' *' : ''}
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
      </FormSection>

      <FormSection title="Media & Links">
        <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
          Image{rules?.requireImage ? ' *' : ''}{mode === 'edit' ? ' (optional — leave blank to keep current)' : ''}
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleImageChange}
            className="text-sm text-gray-900 dark:text-gray-100"
          />
        </label>
        {imagePreview && (
          <img
            src={imagePreview}
            alt=""
            className="h-24 w-24 rounded-lg border border-gray-200 object-cover dark:border-gray-800"
          />
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
            Social Platform
            <select
              value={socialPlatform}
              onChange={(e) => setSocialPlatform(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">None</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>
          </label>

          {socialPlatform && (
            <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
              Social URL
              <input
                type="text"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
            CTA Label{rules?.requireCta ? ' *' : ''}
            <input
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>

          {ctaLabel && (
            <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
              CTA URL{rules?.requireCta ? ' *' : ''}
              <input
                type="text"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
          )}
        </div>
      </FormSection>

      <FormSection title="Affected Resources (optional)">
        <div className="scrollbar-thin flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
          {resourceOptions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No resources found.</p>
          ) : (
            resourceOptions.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100"
              >
                <input
                  type="checkbox"
                  checked={selectedResourceIds.includes(option.id)}
                  onChange={() => toggleResource(option.id)}
                />
                {option.displayName}
              </label>
            ))
          )}
        </div>

        <label
          className={`flex items-center gap-2 text-sm ${
            selectedResourceIds.length === 0
              ? 'text-gray-400 dark:text-gray-600'
              : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          <input
            type="checkbox"
            checked={autoDisableResources}
            disabled={selectedResourceIds.length === 0}
            onChange={(e) => setAutoDisableResources(e.target.checked)}
          />
          Automatically disable selected resources while this bulletin is published.
        </label>
      </FormSection>

      <FormSection title="Publish">
        <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
          Published
        </label>
      </FormSection>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
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
    <div
      className={
        first
          ? 'flex flex-col gap-4'
          : 'flex flex-col gap-4 border-t border-gray-100 pt-5 dark:border-gray-800'
      }
    >
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h4>
      {children}
    </div>
  )
}
