'use client'

import { useEffect, useState } from 'react'

// Mono identifier with a one-click copy. Used under detail-page titles where the raw
// database id is still needed for support but shouldn't be the headline.
export default function CopyableId({ value, label = 'ID' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      // Clipboard can be unavailable (insecure context, permissions); the id stays selectable as text.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${label.toLowerCase()}`}
      className="group inline-flex max-w-full items-center gap-2 rounded-md text-left font-mono text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
    >
      <span className="truncate">{value}</span>
      <span className="shrink-0 rounded border border-gray-200 px-1.5 py-0.5 font-sans text-[11px] font-medium text-gray-600 group-hover:border-gray-300 group-hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:group-hover:border-gray-600 dark:group-hover:text-gray-100">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  )
}
