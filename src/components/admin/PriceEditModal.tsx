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

interface PriceEditModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  fields: PriceEditField[]
}

export default function PriceEditModal({ isOpen, onClose, title, fields }: PriceEditModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {isOpen && <PriceEditForm fields={fields} onClose={onClose} />}
    </Modal>
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
        <label key={field.key} className="flex flex-col gap-1 text-sm text-gray-900">
          {field.label}
          <input
            type="text"
            inputMode="decimal"
            value={values[field.key]}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          />
          {fieldErrors[field.key] && <p className="text-sm text-red-600">{fieldErrors[field.key]}</p>}
        </label>
      ))}

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
          Save
        </button>
      </div>
    </form>
  )
}
