'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidthClassName?: string
  variant?: 'brand' | 'neutral'
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClassName = 'max-w-sm',
  variant = 'brand',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`relative my-auto w-full ${maxWidthClassName} border px-6 py-6 shadow-xl ${
          variant === 'neutral'
            ? 'rounded-2xl border-gray-200 bg-white shadow-gray-900/10'
            : 'rounded-card border-brand-dark/10 bg-brand-light shadow-brand-dark/10'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`absolute right-4 top-4 transition-colors ${
            variant === 'neutral'
              ? 'text-gray-400 hover:text-gray-600'
              : 'text-brand-dark/50 hover:text-brand-dark'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h3
          className={`pr-6 ${
            variant === 'neutral' ? 'text-lg font-semibold text-gray-900' : 'font-serif text-lg text-brand-dark'
          }`}
        >
          {title}
        </h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body
  )
}
