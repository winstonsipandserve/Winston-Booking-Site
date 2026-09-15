import Link from 'next/link'
import type { ReactNode } from 'react'
import CopyableId from '@/components/admin/CopyableId'

interface AdminPageHeaderProps {
  backHref: string
  backLabel: string
  title: string
  /** One line under the title — the when/what a human cares about. */
  subtitle?: ReactNode
  /** Raw record id, shown small in mono with copy-on-click. */
  recordId?: string
  /** Status pill and/or primary actions, right-aligned. */
  aside?: ReactNode
}

// Shared header for admin detail pages: back link, human-readable title, and the
// status/actions cluster, so every record page opens the same way.
export default function AdminPageHeader({ backHref, backLabel, title, subtitle, recordId, aside }: AdminPageHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        href={backHref}
        className="mb-3 inline-flex items-center rounded-md text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <span className="mr-1" aria-hidden="true">
          &larr;
        </span>
        {backLabel}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-tight text-gray-900 dark:text-gray-100">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
          {recordId && (
            <div className="mt-1.5">
              <CopyableId value={recordId} />
            </div>
          )}
        </div>
        {aside && <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1">{aside}</div>}
      </div>
    </div>
  )
}
