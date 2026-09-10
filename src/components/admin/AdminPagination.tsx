import Link from 'next/link'

interface AdminPaginationProps {
  page: number
  totalPages: number
  previousHref: string
  nextHref: string
}

export default function AdminPagination({ page, totalPages, previousHref, nextHref }: AdminPaginationProps) {
  return (
    <nav aria-label="Pagination" className="flex shrink-0 items-center justify-end gap-3 text-sm">
      <span className="text-gray-500 dark:text-gray-400">
        Page {page} of {totalPages}
      </span>
      <Link
        href={previousHref}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Previous
      </Link>
      <Link
        href={nextHref}
        aria-disabled={page >= totalPages}
        tabIndex={page >= totalPages ? -1 : undefined}
        className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Next
      </Link>
    </nav>
  )
}
