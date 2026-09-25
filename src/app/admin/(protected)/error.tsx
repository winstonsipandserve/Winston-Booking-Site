'use client'

import { useEffect } from 'react'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-full items-center justify-center">
      <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Error</p>
        <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">This page couldn&apos;t load</h2>
        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Something went wrong on our side. Try again, or come back in a moment.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-gray-400 dark:text-gray-500">Ref: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 dark:focus-visible:outline-gray-100"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
