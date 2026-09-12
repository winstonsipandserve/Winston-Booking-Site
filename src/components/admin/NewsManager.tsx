'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/admin/ConfirmModal'
import NewsPreview from '@/components/admin/NewsPreview'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { NEWS_CATEGORIES, NEWS_CATEGORY_LABELS } from '@/lib/news'

export interface AdminNewsPost {
  id: string
  slug: string
  title: string
  bodyHtml: string
  coverImageUrl: string | null
  category: 'tournament' | 'community' | 'promo' | 'general'
  publishAt: string | null
  status: 'draft' | 'published'
  isFeatured: boolean
}

function dateTimeLocal(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function publicationLabel(post: AdminNewsPost): string {
  if (post.status === 'draft') return 'Draft'
  if (post.publishAt && new Date(post.publishAt).getTime() > Date.now()) return 'Scheduled'
  return 'Published'
}

export default function NewsManager({ posts }: { posts: AdminNewsPost[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<AdminNewsPost | null | 'new'>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminNewsPost | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function deletePost() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/news/${pendingDelete.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setDeleteError(body?.error ?? 'Could not delete the news post.')
        return
      }
      router.refresh()
      setPendingDelete(null)
    } catch {
      setDeleteError('Could not delete the news post. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">News</h1>
        <button type="button" onClick={() => setEditing('new')} className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">+ Add News</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-gray-100 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100">No news posts yet</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start a draft and publish it when the story is ready.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <article key={post.id} className="flex gap-4 rounded-xl p-4 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 bg-white">
              {post.coverImageUrl ? (
                <img src={post.coverImageUrl} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-gray-400 dark:text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">{post.title}</h2>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">{NEWS_CATEGORY_LABELS[post.category]}</span>
                  <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-gray-100 dark:text-gray-900">{publicationLabel(post)}</span>
                  {post.isFeatured && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">Featured</span>}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">/news/{post.slug}{post.publishAt ? ` · ${new Date(post.publishAt).toLocaleString('en-PH')}` : ''}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => setEditing(post)} className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Edit</button>
                <button type="button" onClick={() => { setDeleteError(null); setPendingDelete(post) }} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400">Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
      </div>
      <NewsFormModal key={editing === 'new' ? 'new' : editing?.id ?? 'closed'} post={editing === 'new' ? null : editing} isOpen={editing !== null} onClose={() => setEditing(null)} />
      <ConfirmModal isOpen={pendingDelete !== null} onClose={() => { setPendingDelete(null); setDeleteError(null) }} onConfirm={deletePost} title="Delete news post?" message={pendingDelete ? `Delete “${pendingDelete.title}” and its uploaded cover image?` : ''} confirmLabel="Delete" confirmVariant="danger" isLoading={deleting} error={deleteError} />
    </>
  )
}


function NewsFormModal({ post, isOpen, onClose }: { post: AdminNewsPost | null; isOpen: boolean; onClose: () => void }) {
  const router = useRouter()
  const initial = useMemo(() => ({
    title: post?.title ?? '',
    bodyHtml: post?.bodyHtml ?? '<p></p>',
    category: post?.category ?? 'general',
    status: post?.status ?? 'draft',
    publishAt: dateTimeLocal(post?.publishAt ?? null),
    featured: post?.isFeatured ?? false,
  }), [post])
  const [title, setTitle] = useState(initial.title)
  const [bodyHtml, setBodyHtml] = useState(initial.bodyHtml)
  const [category, setCategory] = useState<AdminNewsPost['category']>(initial.category)
  const [status, setStatus] = useState<AdminNewsPost['status']>(initial.status)
  const [publishAt, setPublishAt] = useState(initial.publishAt)
  const [featured, setFeatured] = useState(initial.featured)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState(post?.coverImageUrl ?? null)
  const [removeCover, setRemoveCover] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const isDirty =
    title !== initial.title ||
    bodyHtml !== initial.bodyHtml ||
    category !== initial.category ||
    status !== initial.status ||
    publishAt !== initial.publishAt ||
    featured !== initial.featured ||
    image !== null ||
    removeCover

  function requestClose() {
    if (submitting) return
    if (isDirty) {
      setConfirmDiscard(true)
      return
    }
    onClose()
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const publishDate = publishAt ? new Date(publishAt) : null
      if (publishDate && Number.isNaN(publishDate.getTime())) {
        setError('Enter a valid publication date.')
        return
      }
      const formData = new FormData()
      formData.set('title', title)
      formData.set('bodyHtml', bodyHtml)
      formData.set('category', category)
      formData.set('status', status)
      formData.set('isFeatured', String(featured))
      if (publishDate) formData.set('publishAt', publishDate.toISOString())
      if (image) formData.set('coverImage', image)
      formData.set('removeCover', String(removeCover))

      const response = await fetch(post ? `/api/admin/news/${post.id}` : '/api/admin/news', {
        method: post ? 'PATCH' : 'POST',
        body: formData,
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setError(body?.error ?? 'Could not save the news post.')
        return
      }
      router.refresh()
      onClose()
    } catch {
      setError('Could not save the news post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={requestClose} title={post ? 'Edit News' : 'Add News'} maxWidthClassName="max-w-6xl" variant="neutral" closeOnBackdropClick={false}>
        <form onSubmit={submit} className="flex max-h-[80vh] flex-col">
          <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-2">
            <div className="scrollbar-thin flex min-h-0 flex-col gap-5 overflow-y-auto pr-1">
              <div className="grid gap-4 md:grid-cols-[1fr_11rem]">
                <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">Headline *<input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" /></label>
                <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">Category *<select value={category} onChange={(event) => setCategory(event.target.value as AdminNewsPost['category'])} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">{NEWS_CATEGORIES.map((value) => <option key={value} value={value}>{NEWS_CATEGORY_LABELS[value]}</option>)}</select></label>
              </div>
              <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300"><span>Article body *</span><RichTextEditor value={bodyHtml} onChange={setBodyHtml} /></div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">Status *<select value={status} onChange={(event) => setStatus(event.target.value as AdminNewsPost['status'])} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"><option value="draft">Draft</option><option value="published">Published</option></select></label>
                <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">Publish date<input type="datetime-local" value={publishAt} onChange={(event) => setPublishAt(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" /><span className="text-xs text-gray-500 dark:text-gray-400">Blank means now when publishing; a future time schedules it.</span></label>
              </div>
              <label className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300">Cover image {status === 'published' ? '*' : ''}<input type="file" accept="image/jpeg,image/png" onChange={(event) => { const file = event.target.files?.[0] ?? null; setImage(file); setRemoveCover(false); setPreview(file ? URL.createObjectURL(file) : post?.coverImageUrl ?? null) }} />{preview && <span className="flex items-end gap-3"><img src={preview} alt="Cover preview" className="h-24 w-40 rounded-lg object-cover" /><button type="button" onClick={() => { setImage(null); setPreview(null); setRemoveCover(Boolean(post?.coverImageUrl)) }} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400">Remove cover</button></span>}<span className="text-xs text-gray-500 dark:text-gray-400">JPEG or PNG, up to 5 MB. Required before publishing.</span></label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />Feature this post at the top of /news</label>
            </div>
            <aside className="scrollbar-thin hidden min-h-0 flex-col gap-2 overflow-y-auto pr-1 lg:flex" aria-label="Live preview">
              <span className="text-sm text-gray-700 dark:text-gray-300">Preview</span>
              <NewsPreview title={title} bodyHtml={bodyHtml} category={category} publishAt={publishAt} coverUrl={preview} isFeatured={featured} />
            </aside>
          </div>
          {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button type="button" onClick={requestClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900">{submitting ? 'Saving…' : status === 'published' ? 'Save & publish' : 'Save draft'}</button>
          </div>
        </form>
      </Modal>
      <ConfirmModal isOpen={confirmDiscard} onClose={() => setConfirmDiscard(false)} onConfirm={() => { setConfirmDiscard(false); onClose() }} title="Discard changes?" message="You have unsaved changes to this news post. Closing now will throw them away." confirmLabel="Discard" cancelLabel="Keep editing" confirmVariant="danger" />
    </>
  )
}
