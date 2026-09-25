import { formatCentavos } from '@/lib/format'

interface MembershipCheckoutSummaryProps {
  tierLabel: string
  customerName?: string
  totalCentavos: number
  /** Founding Member pricing — shows the standard price this replaces. */
  founding?: { standardCentavos: number } | null
  bordered?: boolean
  totalHighlighted?: boolean
  compact?: boolean
}

export default function MembershipCheckoutSummary({
  tierLabel,
  customerName,
  totalCentavos,
  founding = null,
  bordered = true,
  totalHighlighted = true,
  compact = false,
}: MembershipCheckoutSummaryProps) {
  const rowPadding = compact ? 'py-2' : 'py-3.5'

  return (
    <div
      className={
        bordered
          ? 'rounded-lg border border-gray-200 bg-white px-6 py-7 shadow-sm sm:px-8 sm:py-8'
          : ''
      }
    >
      <div className={`border-b border-gray-200 ${compact ? 'pb-3' : 'pb-5'}`}>
        <p className="text-xl font-semibold text-gray-900">{tierLabel} Membership</p>
        {customerName && <p className="mt-1 text-sm text-gray-500">for {customerName}</p>}
      </div>

      <dl className="flex flex-col divide-y divide-gray-200">
        <div className={`flex justify-between gap-4 ${rowPadding}`}>
          <dt className="text-sm text-gray-500">Term</dt>
          <dd className="text-right font-medium tabular-nums text-gray-900">12 months</dd>
        </div>
        {founding && (
          <div className={`flex justify-between gap-4 ${rowPadding}`}>
            <dt className="text-sm text-gray-500">Founding Member price</dt>
            <dd className="text-right font-medium tabular-nums text-gray-900">
              <span className="text-gray-400 line-through">{formatCentavos(founding.standardCentavos)}</span>{' '}
              {formatCentavos(totalCentavos)}
            </dd>
          </div>
        )}
        {!totalHighlighted && (
          <div className={`flex justify-between gap-4 ${rowPadding}`}>
            <dt className="text-sm text-gray-500">Total Due</dt>
            <dd className="text-right font-medium tabular-nums text-gray-900">
              {formatCentavos(totalCentavos)}
            </dd>
          </div>
        )}
      </dl>

      {totalHighlighted && (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-md bg-gray-900 px-5 py-4 text-white">
          <span className="text-sm font-medium text-gray-300">Total Due</span>
          <span className="text-2xl font-semibold tabular-nums text-white">
            {formatCentavos(totalCentavos)}
          </span>
        </div>
      )}
    </div>
  )
}
