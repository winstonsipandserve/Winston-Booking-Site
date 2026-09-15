import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">404</p>
        <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Record not found</h2>
        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          It may have been deleted, or the link you followed is out of date.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 dark:focus-visible:outline-gray-100"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
