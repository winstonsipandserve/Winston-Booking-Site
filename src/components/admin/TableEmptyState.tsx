import Link from 'next/link'

interface TableEmptyStateProps {
  colSpan: number
  /** Singular noun for the empty copy, e.g. "booking" → "No bookings yet". */
  noun: string
  nounPlural?: string
  /** Shown under the title when the list is genuinely empty (no filters applied). */
  hint?: string
  /** True when a search or filter is narrowing the list; switches the copy and shows Clear filters. */
  isFiltered: boolean
  /** Where "Clear filters" goes — normally the bare list URL. */
  clearHref: string
}

/**
 * Empty row for admin tables. Distinguishes "nothing exists" from "nothing matches", and offers
 * a way back from a filter that returned zero rows so the admin isn't left with a grey sentence.
 */
export default function TableEmptyState({
  colSpan,
  noun,
  nounPlural = `${noun}s`,
  hint,
  isFiltered,
  clearHref,
}: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12">
        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {isFiltered ? `No ${nounPlural} match these filters` : `No ${nounPlural} yet`}
          </p>
          {isFiltered ? (
            <>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try a different search or filter, or clear them to see every {noun}.
              </p>
              <Link
                href={clearHref}
                className="mt-4 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Clear filters
              </Link>
            </>
          ) : (
            hint && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
          )}
        </div>
      </td>
    </tr>
  )
}
