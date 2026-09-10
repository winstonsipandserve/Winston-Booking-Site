'use client'

interface LoadingOverlayProps {
  isOpen: boolean
  label?: string
}

export default function LoadingOverlay({ isOpen, label = 'Please wait…' }: LoadingOverlayProps) {
  if (!isOpen) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/60"
    >
      <svg
        className="h-10 w-10 animate-spin text-white"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p className="text-sm font-medium text-white">{label}</p>
    </div>
  )
}
