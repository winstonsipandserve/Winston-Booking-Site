'use client'

import { useRef, useState } from 'react'

// Drag-and-drop image picker with a "Browse files" fallback. Shows the chosen (or existing)
// image with Replace / Remove actions once there is one. Validation of type and size stays
// on the server; `accept` only filters the file dialog and dropped files.

const ACCEPTED_TYPES = ['image/jpeg', 'image/png']

export default function ImageDropzone({ previewUrl, onSelect, onRemove, disabled = false, hint }: {
  previewUrl: string | null
  onSelect: (file: File) => void
  onRemove: () => void
  disabled?: boolean
  hint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [rejected, setRejected] = useState(false)

  function pick(file: File | null | undefined) {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setRejected(true)
      return
    }
    setRejected(false)
    onSelect(file)
  }

  function openDialog() {
    if (!disabled) inputRef.current?.click()
  }

  const dropHandlers = disabled ? {} : {
    onDragOver: (event: React.DragEvent) => { event.preventDefault(); setDragging(true) },
    onDragLeave: () => setDragging(false),
    onDrop: (event: React.DragEvent) => {
      event.preventDefault()
      setDragging(false)
      pick(event.dataTransfer.files?.[0])
    },
  }

  return (
    <div className="flex flex-col gap-2">
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="sr-only" tabIndex={-1} onChange={(event) => { pick(event.target.files?.[0]); event.target.value = '' }} />
      {previewUrl ? (
        <div {...dropHandlers} className={`relative overflow-hidden rounded-xl border bg-gray-50 dark:bg-gray-800 ${dragging ? 'border-gray-900 dark:border-gray-100' : 'border-gray-200 dark:border-gray-700'}`}>
          <img src={previewUrl} alt="Cover preview" className="aspect-[16/9] w-full object-cover" />
          <div className="flex items-center justify-end gap-3 px-3 py-2 text-sm">
            <button type="button" onClick={openDialog} disabled={disabled} className="font-medium text-gray-600 hover:text-gray-900 disabled:opacity-60 dark:text-gray-300 dark:hover:text-white">Replace</button>
            <button type="button" onClick={onRemove} disabled={disabled} className="font-medium text-red-600 hover:text-red-700 disabled:opacity-60 dark:text-red-400">Remove</button>
          </div>
        </div>
      ) : (
        <div
          {...dropHandlers}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={openDialog}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDialog() } }}
          aria-disabled={disabled}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragging
              ? 'border-gray-900 bg-gray-100 dark:border-gray-100 dark:bg-gray-800'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-gray-500 dark:hover:bg-gray-800'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-9 w-9 text-gray-400 dark:text-gray-500" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Zm10.5-11.25h.008v.008h-.008V9.75Z" />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-300">Drag your cover image here to upload</p>
          <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">or</span>
          <span className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-gray-100 dark:text-gray-900">Browse files</span>
        </div>
      )}
      {rejected && <p className="text-xs text-red-600 dark:text-red-400">Only JPEG or PNG images are accepted.</p>}
      {hint && <span className="text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
    </div>
  )
}
