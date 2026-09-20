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
          ? 'rounded-card border border-brand-dark/10 bg-brand-light px-6 py-7 shadow-card sm:px-8 sm:py-8'
          : ''
      }
    >
      <div className={`border-b border-brand-dark/10 ${compact ? 'pb-3' : 'pb-5'}`}>
        <p className="font-serif text-2xl text-brand-dark">{tierLabel} Membership</p>
        {customerName && <p className="mt-1 text-sm text-brand-dark/60">for {customerName}</p>}
      </div>

      <dl className="flex flex-col divide-y divide-brand-dark/10">
        <div className={`flex justify-between gap-4 ${rowPadding}`}>
          <dt className="text-sm text-brand-dark/65">Term</dt>
          <dd className="text-right font-medium tabular-nums text-brand-dark/85">12 months</dd>
        </div>
        {founding && (
          <div className={`flex justify-between gap-4 ${rowPadding}`}>
            <dt className="text-sm text-brand-dark/65">Founding Member price</dt>
            <dd className="text-right font-medium tabular-nums text-brand-dark/85">
              <span className="text-brand-dark/50 line-through">{formatCentavos(founding.standardCentavos)}</span>{' '}
              {formatCentavos(totalCentavos)}
            </dd>
          </div>
        )}
        {!totalHighlighted && (
          <div className={`flex justify-between gap-4 ${rowPadding}`}>
            <dt className="text-sm text-brand-dark/65">Total Due</dt>
            <dd className="text-right font-medium tabular-nums text-brand-dark/85">
              {formatCentavos(totalCentavos)}
            </dd>
          </div>
        )}
      </dl>

      {totalHighlighted && (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-card-inline bg-brand-dark px-5 py-4 text-brand-light">
          <span className="text-sm font-medium uppercase tracking-[0.16em] text-brand-light/75">
            Total Due
          </span>
          <span className="font-serif text-3xl tabular-nums text-brand-light">
            {formatCentavos(totalCentavos)}
          </span>
        </div>
      )}
    </div>
  )
}
