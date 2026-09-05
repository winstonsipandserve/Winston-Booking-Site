'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { parseCentavos } from '@/lib/format'

export interface PriceEditField {
  key: string
  label: string
  endpoint: string
  bodyKey: 'priceCentavos' | 'amountCentavos'
  currentCentavos: number
}

export interface PriceCreateField {
  label: string
  endpoint: string
  body: Record<string, unknown>
}

interface PriceEditModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  fields?: PriceEditField[]
  createField?: PriceCreateField
}

export default function PriceEditModal({ isOpen, onClose, title, fields, createField }: PriceEditModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} variant="neutral">
      {isOpen && createField && <PriceCreateForm createField={createField} onClose={onClose} />}
      {isOpen && !createField && <PriceEditForm fields={fields ?? []} onClose={onClose} />}
    </Modal>
  )
}

function PriceCreateForm({ createField, onClose }: { createField: PriceCreateField; onClose: () => void }) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = parseCentavos(value)
    if (parsed === null || parsed === 0) {
      setError('Enter a valid amount')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(createField.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createField.body, priceCentavos: parsed }),
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
      <label className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
        {createField.label}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </label>

      <div className="mt-2 flex items-center justify-end gap-3">
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
          Create
        </button>
      </div>
    </form>
  )
}

function PriceEditForm({ fields, onClose }: { fields: PriceEditField[]; onClose: () => void }) {
  const router = useRouter()
  const initialValues = Object.fromEntries(
    fields.map((f) => [f.key, (f.currentCentavos / 100).toFixed(2)]),
  )
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const changedFields = fields.filter((f) => values[f.key] !== initialValues[f.key])
    if (changedFields.length === 0) {
      onClose()
      return
    }

    const nextErrors: Record<string, string> = {}
    const toSubmit: { field: PriceEditField; parsed: number }[] = []
    for (const field of changedFields) {
      const parsed = parseCentavos(values[field.key])
      if (parsed === null) {
        nextErrors[field.key] = 'Enter a valid amount'
      } else {
        toSubmit.push({ field, parsed })
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setFieldErrors({})

    try {
      const results = await Promise.all(
        toSubmit.map(async ({ field, parsed }) => {
          const res = await fetch(field.endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field.bodyKey]: parsed }),
          })
          if (!res.ok) {
            const json = await res.json().catch(() => null)
            return { key: field.key, error: json?.error ?? 'Something went wrong. Please try again.' }
          }
          return { key: field.key, error: null }
        }),
      )

      const failures = results.filter((r) => r.error !== null)
      if (failures.length > 0) {
        setFieldErrors(Object.fromEntries(failures.map((f) => [f.key, f.error as string])))
        setIsSubmitting(false)
        return
      }

      router.refresh()
      onClose()
    } catch {
      setFieldErrors(
        Object.fromEntries(toSubmit.map(({ field }) => [field.key, 'Something went wrong. Please try again.'])),
      )
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {fields.map((field) => (
        <label key={field.key} className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
          {field.label}
          <input
            type="text"
            inputMode="decimal"
            value={values[field.key]}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          {fieldErrors[field.key] && <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors[field.key]}</p>}
        </label>
      ))}

      <div className="mt-2 flex items-center justify-end gap-3">
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
          Save
        </button>
      </div>
    </form>
  )
}
