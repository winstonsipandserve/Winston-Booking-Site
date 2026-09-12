'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/admin/ConfirmModal'
import { ANNOUNCEMENT_URGENCIES, ANNOUNCEMENT_URGENCY_LABELS } from '@/lib/announcement-validation'

export interface AnnouncementResourceOption {
  id: string
  displayName: string
}

export interface AdminAnnouncement {
  id: string
  title: string
  message: string
  urgency: 'info' | 'warning' | 'urgent'
  isActive: boolean
  announceAt: string | null
  startAt: string
  endAt: string | null
  autoDisableResources: boolean
  resourceIds: string[]
  resourceNames: string[]
}

function dateTimeLocal(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function statusFor(announcement: AdminAnnouncement): string {
  if (!announcement.isActive) return 'Inactive'
  const now = Date.now()
  const visibleFrom = new Date(announcement.announceAt ?? announcement.startAt).getTime()
  if (visibleFrom > now) return 'Scheduled'
  if (announcement.endAt && new Date(announcement.endAt).getTime() <= now) return 'Expired'
  // Visible to customers as advance notice; the operational window has not started.
  if (new Date(announcement.startAt).getTime() > now) return 'Announced'
  return 'Live'
}

export default function AnnouncementManager({
  announcements,
  resources,
}: {
  announcements: AdminAnnouncement[]
  resources: AnnouncementResourceOption[]
}) {
  const [editing, setEditing] = useState<AdminAnnouncement | null | 'new'>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminAnnouncement | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const router = useRouter()

  async function deleteAnnouncement() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/announcements/${pendingDelete.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setDeleteError(body?.error ?? 'Could not delete the announcement.')
        return
      }
      router.refresh()
      setPendingDelete(null)
    } catch {
      setDeleteError('Could not delete the announcement. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Booking-impact notices shown before customers choose a court or bay.
        </p>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          + Add Announcement
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100">No announcements yet</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Customers will see the clear-to-book empty state.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="rounded-xl bg-white p-4 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">{announcement.title}</h2>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {ANNOUNCEMENT_URGENCY_LABELS[announcement.urgency]}
                    </span>
                    <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-gray-100 dark:text-gray-900">
                      {statusFor(announcement)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{announcement.message}</p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(announcement.startAt).toLocaleString('en-PH')}
                    {announcement.endAt ? ` – ${new Date(announcement.endAt).toLocaleString('en-PH')}` : ' – No end date'}
                    {announcement.announceAt && ` · Shown from ${new Date(announcement.announceAt).toLocaleString('en-PH')}`}
                  </p>
                  {announcement.resourceNames.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {announcement.autoDisableResources ? 'Taking offline: ' : 'Affects: '}
                      {announcement.resourceNames.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => setEditing(announcement)} className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Edit</button>
                  <button type="button" onClick={() => { setDeleteError(null); setPendingDelete(announcement) }} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400">Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AnnouncementFormModal
        key={editing === 'new' ? 'new' : editing?.id ?? 'closed'}
        announcement={editing === 'new' ? null : editing}
        resources={resources}
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
      />
      <ConfirmModal
        isOpen={pendingDelete !== null}
        onClose={() => { setPendingDelete(null); setDeleteError(null) }}
        onConfirm={deleteAnnouncement}
        title="Delete announcement?"
        message={pendingDelete ? `Delete “${pendingDelete.title}”? Linked resources will be released unless another announcement or a manual disable still applies.` : ''}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={deleting}
        error={deleteError}
      />
    </>
  )
}

function AnnouncementFormModal({
  announcement,
  resources,
  isOpen,
  onClose,
}: {
  announcement: AdminAnnouncement | null
  resources: AnnouncementResourceOption[]
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState(announcement?.title ?? '')
  const [message, setMessage] = useState(announcement?.message ?? '')
  const [urgency, setUrgency] = useState<AdminAnnouncement['urgency']>(announcement?.urgency ?? 'info')
  const [isActive, setIsActive] = useState(announcement?.isActive ?? true)
  const [announceAt, setAnnounceAt] = useState(dateTimeLocal(announcement?.announceAt ?? null))
  const [startAt, setStartAt] = useState(dateTimeLocal(announcement?.startAt ?? new Date().toISOString()))
  const [endAt, setEndAt] = useState(dateTimeLocal(announcement?.endAt ?? null))
  const [resourceIds, setResourceIds] = useState(announcement?.resourceIds ?? [])
  const [autoDisable, setAutoDisable] = useState(announcement?.autoDisableResources ?? false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggleResource(id: string) {
    setResourceIds((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
      if (next.length === 0) setAutoDisable(false)
      return next
    })
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const startDate = new Date(startAt)
      const endDate = endAt ? new Date(endAt) : null
      const announceDate = announceAt ? new Date(announceAt) : null
      if (
        Number.isNaN(startDate.getTime()) ||
        (endDate && Number.isNaN(endDate.getTime())) ||
        (announceDate && Number.isNaN(announceDate.getTime()))
      ) {
        setError('Enter valid dates.')
        return
      }
      if (endDate && endDate <= startDate) {
        setError('"Affects until" must be after "Affects from".')
        return
      }
      if (announceDate && announceDate > startDate) {
        setError('"Show notice from" must be on or before "Affects from".')
        return
      }
      const formData = new FormData()
      formData.set('title', title)
      formData.set('message', message)
      formData.set('urgency', urgency)
      formData.set('isActive', String(isActive))
      if (announceDate) formData.set('announceAt', announceDate.toISOString())
      formData.set('startAt', startDate.toISOString())
      if (endDate) formData.set('endAt', endDate.toISOString())
      formData.set('resourceIds', JSON.stringify(resourceIds))
      formData.set('autoDisableResources', String(autoDisable))

      const response = await fetch(
        announcement ? `/api/admin/announcements/${announcement.id}` : '/api/admin/announcements',
        { method: announcement ? 'PATCH' : 'POST', body: formData },
      )
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setError(body?.error ?? 'Could not save the announcement.')
        return
      }
      router.refresh()
      onClose()
    } catch {
      setError('Could not save the announcement. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={announcement ? 'Edit Announcement' : 'Add Announcement'} maxWidthClassName="max-w-2xl" variant="neutral">
      <form onSubmit={submit} className="scrollbar-thin flex max-h-[78vh] flex-col gap-5 overflow-y-auto pr-1">
        <div className="grid gap-4 md:grid-cols-[1fr_11rem]">
          <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">Title *<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} required className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" /></label>
          <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">Urgency *<select value={urgency} onChange={(event) => setUrgency(event.target.value as AdminAnnouncement['urgency'])} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">{ANNOUNCEMENT_URGENCIES.map((value) => <option key={value} value={value}>{ANNOUNCEMENT_URGENCY_LABELS[value]}</option>)}</select></label>
        </div>
        <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">Short message *<textarea value={message} onChange={(event) => setMessage(event.target.value)} required rows={4} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">Affects from *<input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} required className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" /><span className="text-xs text-gray-500 dark:text-gray-400">When the closure or change actually begins.</span></label>
          <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">Affects until (optional)<input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" /><span className="text-xs text-gray-500 dark:text-gray-400">The notice is removed from the booking page at this time.</span></label>
        </div>
        <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">Show notice from (optional)<input type="datetime-local" value={announceAt} onChange={(event) => setAnnounceAt(event.target.value)} max={startAt || undefined} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" /><span className="text-xs text-gray-500 dark:text-gray-400">Set an earlier date to give customers advance warning. Leave blank to show the notice only once it takes effect. Courts and bays stay bookable until &ldquo;Affects from&rdquo; either way.</span></label>
        <fieldset className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
          <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Affected courts &amp; bays</legend>
          <div className="mt-2 grid max-h-40 gap-2 overflow-y-auto md:grid-cols-2">
            {resources.map((resource) => <label key={resource.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={resourceIds.includes(resource.id)} onChange={() => toggleResource(resource.id)} />{resource.displayName}</label>)}
          </div>
          <label className="mt-4 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" className="mt-0.5" checked={autoDisable} disabled={resourceIds.length === 0} onChange={(event) => setAutoDisable(event.target.checked)} /><span>Automatically take selected resources offline between &ldquo;Affects from&rdquo; and &ldquo;Affects until&rdquo;.</span></label>
        </fieldset>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />Active</label>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900">{submitting ? 'Saving…' : 'Save announcement'}</button>
        </div>
      </form>
    </Modal>
  )
}
