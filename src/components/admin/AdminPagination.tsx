import Link from 'next/link'

interface AdminPaginationBaseProps {
  page: number
  pageSize: number
  totalCount: number
  /** Singular noun for the result count, e.g. "booking" → "12 bookings". */
  noun: string
  /** Override when the plural isn't just `noun + 's'`. */
  nounPlural?: string
}

type AdminPaginationProps = AdminPaginationBaseProps &
  (
    | { previousHref: string; nextHref: string; onPrevious?: never; onNext?: never }
    | { onPrevious: () => void; onNext: () => void; previousHref?: never; nextHref?: never }
  )

const BUTTON_CLASS =
  'rounded-lg bg-gray-900 px-3 py-1.5 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'

function formatCount(count: number, noun: string, nounPlural?: string) {
  return `${count.toLocaleString('en-PH')} ${count === 1 ? noun : (nounPlural ?? `${noun}s`)}`
}

/**
 * Result count plus Previous/Next controls. When everything fits on one page the
 * controls are hidden and only the count shows; when the list is empty nothing renders
 * (the table's own empty state covers that).
 */
export default function AdminPagination(props: AdminPaginationProps) {
  const { page, pageSize, totalCount, noun, nounPlural } = props
  if (totalCount === 0) return null

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const countLabel = formatCount(totalCount, noun, nounPlural)

  if (totalPages <= 1) {
    return (
      <p className="shrink-0 text-right text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
        {countLabel}
      </p>
    )
  }

  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalCount)
  const isFirst = page <= 1
  const isLast = page >= totalPages

  return (
    <nav aria-label="Pagination" className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-2 text-sm">
      <span className="text-gray-600 dark:text-gray-400">
        {first.toLocaleString('en-PH')}–{last.toLocaleString('en-PH')} of {countLabel}
        <span aria-hidden="true" className="mx-2 text-gray-300 dark:text-gray-600">
          ·
        </span>
        Page {page} of {totalPages}
      </span>
      {'previousHref' in props && props.previousHref !== undefined ? (
        <>
          <Link
            href={props.previousHref}
            aria-disabled={isFirst}
            tabIndex={isFirst ? -1 : undefined}
            className={BUTTON_CLASS}
          >
            Previous
          </Link>
          <Link href={props.nextHref} aria-disabled={isLast} tabIndex={isLast ? -1 : undefined} className={BUTTON_CLASS}>
            Next
          </Link>
        </>
      ) : (
        <>
          <button type="button" onClick={props.onPrevious} disabled={isFirst} className={BUTTON_CLASS}>
            Previous
          </button>
          <button type="button" onClick={props.onNext} disabled={isLast} className={BUTTON_CLASS}>
            Next
          </button>
        </>
      )}
    </nav>
  )
}
