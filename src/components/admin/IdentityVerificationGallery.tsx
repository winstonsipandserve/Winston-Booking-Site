'use client'

import { useEffect, useState } from 'react'

export default function IdentityVerificationGallery({
  images,
}: {
  images: { label: string; url: string }[]
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    if (openIndex === null) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenIndex(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openIndex])

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {images.map((image, index) => (
          <div key={image.label}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {image.label}
            </p>
            <button type="button" onClick={() => setOpenIndex(index)}>
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                <img
                  src={image.url}
                  alt={`Government ID — ${image.label.toLowerCase()}`}
                  className="h-full w-full cursor-zoom-in object-cover transition-opacity hover:opacity-90"
                />
              </div>
            </button>
          </div>
        ))}
      </div>

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpenIndex(null)}
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={images[openIndex].url}
            alt={`Government ID — ${images[openIndex].label.toLowerCase()}`}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
