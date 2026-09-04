'use client'

import Modal from '@/components/ui/Modal'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'default' | 'danger'
  hideCancel?: boolean
  isLoading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'default',
  hideCancel = false,
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} variant="neutral">
      <p className="text-sm text-gray-600">{message}</p>
      <div className="mt-6 flex items-center justify-end gap-3">
        {!hideCancel && (
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
            confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
          }`}
        >
          {isLoading ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
